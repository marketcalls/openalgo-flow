"""
Workflow Executor Service
Executes workflow nodes using the OpenAlgo Python SDK
"""
from datetime import datetime, time
from typing import Optional, Dict, Any, List, Set, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
import asyncio
import re
import json
import threading

from app.core.database import async_session_maker
from app.core.openalgo import OpenAlgoClient
from app.core.scheduler import workflow_scheduler
from app.core.encryption import decrypt_safe
from app.models.workflow import Workflow, WorkflowExecution
from app.models.settings import AppSettings
from app.api.websocket import broadcast_execution_update

logger = logging.getLogger(__name__)


def parse_time_string(time_str: str, default_hour: int = 9, default_minute: int = 15) -> Tuple[int, int, int]:
    """Safely parse a time string in HH:MM or HH:MM:SS format.

    Returns (hour, minute, second) tuple. On invalid input, returns default values.
    """
    if not time_str or not isinstance(time_str, str):
        return (default_hour, default_minute, 0)

    try:
        parts = time_str.strip().split(":")
        if not parts:
            return (default_hour, default_minute, 0)

        hour = int(parts[0]) if parts[0].isdigit() else default_hour
        minute = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else default_minute
        second = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 0

        # Validate ranges
        hour = max(0, min(23, hour))
        minute = max(0, min(59, minute))
        second = max(0, min(59, second))

        return (hour, minute, second)
    except (ValueError, AttributeError, IndexError) as e:
        logger.warning(f"Failed to parse time string '{time_str}': {e}")
        return (default_hour, default_minute, 0)


# Execution locks to prevent concurrent execution of the same workflow
_workflow_locks: Dict[int, asyncio.Lock] = {}
_workflow_locks_lock = threading.Lock()  # Thread-safe access to locks dict

# Execution limits
MAX_NODE_DEPTH = 100  # Maximum recursion depth for node chain
MAX_NODE_VISITS = 500  # Maximum total node visits per execution


def get_workflow_lock(workflow_id: int) -> asyncio.Lock:
    """Get or create an asyncio lock for a workflow"""
    with _workflow_locks_lock:
        if workflow_id not in _workflow_locks:
            _workflow_locks[workflow_id] = asyncio.Lock()
        return _workflow_locks[workflow_id]


class WorkflowContext:
    """Context for storing variables during workflow execution"""

    def __init__(self):
        self.variables: Dict[str, Any] = {}
        self.condition_results: Dict[str, bool] = {}  # Store condition results by node ID

    def set_variable(self, name: str, value: Any):
        """Store a variable"""
        self.variables[name] = value

    def get_variable(self, name: str, default: Any = None) -> Any:
        """Get a variable value"""
        return self.variables.get(name, default)

    def set_condition_result(self, node_id: str, result: bool):
        """Store a condition result for a node"""
        self.condition_results[node_id] = result

    def get_condition_result(self, node_id: str) -> Optional[bool]:
        """Get the condition result for a node"""
        return self.condition_results.get(node_id)

    def _get_builtin_variable(self, name: str) -> Optional[str]:
        """Get built-in system variables"""
        now = datetime.now()
        builtins = {
            "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
            "date": now.strftime("%Y-%m-%d"),
            "time": now.strftime("%H:%M:%S"),
            "year": now.strftime("%Y"),
            "month": now.strftime("%m"),
            "day": now.strftime("%d"),
            "hour": now.strftime("%H"),
            "minute": now.strftime("%M"),
            "second": now.strftime("%S"),
            "weekday": now.strftime("%A"),
            "iso_timestamp": now.isoformat(),
        }
        return builtins.get(name)

    def interpolate(self, text: str) -> str:
        """Replace {{variable}} patterns with actual values"""
        if not isinstance(text, str):
            return text

        def replacer(match):
            var_path = match.group(1).strip()

            # Check built-in variables first
            builtin_value = self._get_builtin_variable(var_path)
            if builtin_value is not None:
                return builtin_value

            # Then check user variables
            parts = var_path.split(".")
            value = self.variables

            for part in parts:
                if isinstance(value, dict):
                    value = value.get(part)
                else:
                    return match.group(0)  # Return original if not found

                if value is None:
                    return match.group(0)

            return str(value) if value is not None else match.group(0)

        return re.sub(r"\{\{([^}]+)\}\}", replacer, text)


async def get_openalgo_client() -> Optional[OpenAlgoClient]:
    """Get OpenAlgo client from settings"""
    async with async_session_maker() as db:
        result = await db.execute(select(AppSettings).limit(1))
        settings = result.scalar_one_or_none()

        if not settings or not settings.openalgo_api_key:
            return None

        # Decrypt the API key
        api_key = decrypt_safe(settings.openalgo_api_key)
        if not api_key:
            logger.error("Failed to decrypt API key")
            return None

        return OpenAlgoClient(
            api_key=api_key, host=settings.openalgo_host
        )


def run_sync(coro):
    """Run async function synchronously (SDK methods are sync)"""
    return coro


class NodeExecutor:
    """Executes individual workflow nodes"""

    def __init__(self, client: OpenAlgoClient, context: WorkflowContext, logs: list):
        self.client = client
        self.context = context
        self.logs = logs

    def log(self, message: str, level: str = "info"):
        """Add log entry"""
        self.logs.append(
            {"time": datetime.utcnow().isoformat(), "message": message, "level": level}
        )
        if level == "error":
            logger.error(message)
        else:
            logger.info(message)

    def store_output(self, node_data: dict, result: Any):
        """Store result in output variable if configured"""
        output_var = node_data.get("outputVariable")
        if output_var and output_var.strip():
            self.context.set_variable(output_var.strip(), result)
            self.log(f"Stored result in variable: {output_var}")

    def interpolate_value(self, value: Any) -> Any:
        """Interpolate variables in a value (string, number, or keep as-is)"""
        if isinstance(value, str):
            interpolated = self.context.interpolate(value)
            # Try to convert to number if it looks like one
            if interpolated.isdigit():
                return int(interpolated)
            try:
                return float(interpolated)
            except ValueError:
                return interpolated
        return value

    def get_str(self, node_data: dict, key: str, default: str = "") -> str:
        """Get interpolated string value from node data"""
        value = node_data.get(key, default)
        return self.context.interpolate(str(value)) if value else default

    def get_int(self, node_data: dict, key: str, default: int = 0) -> int:
        """Get interpolated integer value from node data"""
        value = node_data.get(key, default)
        if isinstance(value, str):
            interpolated = self.context.interpolate(value)
            try:
                return int(float(interpolated))
            except (ValueError, TypeError):
                return default
        return int(value) if value else default

    def get_float(self, node_data: dict, key: str, default: float = 0.0) -> float:
        """Get interpolated float value from node data"""
        value = node_data.get(key, default)
        if isinstance(value, str):
            interpolated = self.context.interpolate(value)
            try:
                return float(interpolated)
            except (ValueError, TypeError):
                return default
        return float(value) if value else default

    def execute_place_order(self, node_data: dict) -> dict:
        """Execute Place Order node - supports {{variable}} interpolation"""
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        action = self.get_str(node_data, "action", "BUY")
        quantity = self.get_int(node_data, "quantity", 1)
        price_type = self.get_str(node_data, "priceType", "MARKET")
        product = self.get_str(node_data, "product", "MIS")
        price = self.get_float(node_data, "price", 0)
        trigger_price = self.get_float(node_data, "triggerPrice", 0)

        self.log(f"Placing order: {symbol} {action} qty={quantity}")
        result = self.client.place_order(
            symbol=symbol,
            exchange=exchange,
            action=action,
            quantity=quantity,
            price_type=price_type,
            product=product,
            price=price,
            trigger_price=trigger_price,
        )
        self.log(
            f"Order result: {result}",
            "info" if result.get("status") == "success" else "error",
        )
        self.store_output(node_data, result)
        return result

    def execute_smart_order(self, node_data: dict) -> dict:
        """Execute Smart Order node - supports {{variable}} interpolation"""
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        action = self.get_str(node_data, "action", "BUY")
        quantity = self.get_int(node_data, "quantity", 1)
        position_size = self.get_int(node_data, "positionSize", 0)
        price_type = self.get_str(node_data, "priceType", "MARKET")
        product = self.get_str(node_data, "product", "MIS")
        price = self.get_float(node_data, "price", 0)
        trigger_price = self.get_float(node_data, "triggerPrice", 0)

        self.log(f"Placing smart order: {symbol} {action}")
        result = self.client.place_smart_order(
            symbol=symbol,
            exchange=exchange,
            action=action,
            quantity=quantity,
            position_size=position_size,
            price_type=price_type,
            product=product,
            price=price,
            trigger_price=trigger_price,
        )
        self.log(
            f"Smart order result: {result}",
            "info" if result.get("status") == "success" else "error",
        )
        self.store_output(node_data, result)
        return result

    def execute_options_order(self, node_data: dict) -> dict:
        """Execute Options Order node - supports {{variable}} interpolation"""
        underlying = self.get_str(node_data, "underlying", "NIFTY")
        expiry_type = self.get_str(node_data, "expiryType", "current_week")
        quantity = self.get_int(node_data, "quantity", 1)
        offset = self.get_str(node_data, "offset", "ATM")
        option_type = self.get_str(node_data, "optionType", "CE")
        action = self.get_str(node_data, "action", "BUY")
        price_type = self.get_str(node_data, "priceType", "MARKET")
        product = self.get_str(node_data, "product", "NRML")
        split_size = self.get_int(node_data, "splitSize", 0)

        self.log(f"Placing options order: {underlying} {option_type} {offset}")

        # Get the underlying exchange for index
        if underlying in ["SENSEX", "BANKEX", "SENSEX50"]:
            underlying_exchange = "BSE_INDEX"
            fo_exchange = "BFO"
        else:
            underlying_exchange = "NSE_INDEX"
            fo_exchange = "NFO"

        # Get lot size
        lot_sizes = {
            "NIFTY": 75, "BANKNIFTY": 30, "FINNIFTY": 65,
            "MIDCPNIFTY": 120, "NIFTYNXT50": 25,
            "SENSEX": 20, "BANKEX": 30, "SENSEX50": 25
        }
        lot_size = lot_sizes.get(underlying, 75)
        total_quantity = quantity * lot_size

        # Resolve expiry date from expiry type
        expiry_date = self._resolve_expiry_date(underlying, fo_exchange, expiry_type)
        if not expiry_date:
            return {"status": "error", "message": f"Could not resolve expiry for {expiry_type}"}

        self.log(f"Resolved expiry: {expiry_type} -> {expiry_date}")

        result = self.client.options_order(
            underlying=underlying,
            exchange=underlying_exchange,
            expiry_date=expiry_date,
            offset=offset,
            option_type=option_type,
            action=action,
            quantity=total_quantity,
            price_type=price_type,
            product=product,
            splitsize=split_size,
        )
        self.log(
            f"Options order result: {result}",
            "info" if result.get("status") == "success" else "error",
        )
        self.store_output(node_data, result)
        return result

    def execute_options_multi_order(self, node_data: dict) -> dict:
        """Execute Multi-Leg Options Order node - supports {{variable}} interpolation

        Note: product and pricetype are specified per-leg in the legs array.
        """
        underlying = self.get_str(node_data, "underlying", "NIFTY")
        strategy = self.get_str(node_data, "strategy", "straddle")
        action = self.get_str(node_data, "action", "SELL")
        quantity = self.get_int(node_data, "quantity", 1)
        expiry_type = self.get_str(node_data, "expiryType", "current_week")
        product = self.get_str(node_data, "product", "NRML")
        price_type = self.get_str(node_data, "priceType", "MARKET")

        self.log(
            f"Placing multi-leg options order: {underlying} strategy={strategy} action={action} product={product}"
        )

        # Get the underlying exchange for index
        underlying_exchange = "NSE_INDEX"
        if underlying in ["SENSEX", "BANKEX", "SENSEX50"]:
            underlying_exchange = "BSE_INDEX"
            fo_exchange = "BFO"
        else:
            fo_exchange = "NFO"

        # Get lot size
        lot_sizes = {
            "NIFTY": 75, "BANKNIFTY": 30, "FINNIFTY": 65,
            "MIDCPNIFTY": 120, "NIFTYNXT50": 25,
            "SENSEX": 20, "BANKEX": 30, "SENSEX50": 25
        }
        lot_size = lot_sizes.get(underlying, 75)
        total_quantity = quantity * lot_size

        # Resolve expiry date from expiry type
        expiry_date = self._resolve_expiry_date(underlying, fo_exchange, expiry_type)
        if not expiry_date:
            return {"status": "error", "message": f"Could not resolve expiry for {expiry_type}"}

        self.log(f"Resolved expiry: {expiry_type} -> {expiry_date}")

        # Build legs based on strategy (includes product, pricetype, expiry_date per leg)
        legs = self._build_strategy_legs(strategy, action, total_quantity, expiry_date, product, price_type)
        if not legs:
            return {"status": "error", "message": f"Unknown strategy: {strategy}"}

        self.log(f"Strategy legs: {json.dumps(legs, indent=2)}")

        # expiry_date, product, pricetype are now included in each leg
        result = self.client.options_multi_order(
            underlying=underlying,
            exchange=underlying_exchange,
            legs=legs,
        )
        self.log(
            f"Multi-leg order result: {result}",
            "info" if result.get("status") == "success" else "error",
        )
        self.store_output(node_data, result)
        return result

    def _resolve_expiry_date(self, symbol: str, exchange: str, expiry_type: str) -> Optional[str]:
        """Resolve expiry type to actual expiry date"""
        try:
            response = self.client.get_expiry(symbol=symbol, exchange=exchange, instrumenttype="options")
            if response.get("status") != "success":
                self.log(f"Failed to fetch expiry: {response}", "error")
                return None

            expiry_list = response.get("data", [])
            if not expiry_list:
                self.log(f"No expiry dates found for {symbol} on {exchange}", "error")
                return None

            # Parse and sort expiry dates, filtering out unparseable ones
            def parse_expiry(exp_str: str) -> Optional[datetime]:
                """Parse expiry date string, returns None on failure"""
                if not exp_str or not isinstance(exp_str, str):
                    return None
                # Format: "10-JUL-25" or "25DEC25"
                for fmt in ["%d-%b-%y", "%d%b%y"]:
                    try:
                        return datetime.strptime(exp_str.upper(), fmt)
                    except ValueError:
                        continue
                self.log(f"Warning: Could not parse expiry date '{exp_str}'", "warning")
                return None

            # Filter and sort expiries, removing unparseable ones
            valid_expiries = []
            for exp_str in expiry_list:
                parsed = parse_expiry(exp_str)
                if parsed is not None:
                    valid_expiries.append((exp_str, parsed))

            if not valid_expiries:
                self.log(f"No valid expiry dates found for {symbol}", "error")
                return None

            # Sort by parsed date
            valid_expiries.sort(key=lambda x: x[1])
            sorted_expiries = [exp[0] for exp in valid_expiries]
            now = datetime.now()
            current_month = now.month
            current_year = now.year

            # Calculate next month
            if current_month == 12:
                next_month, next_year = 1, current_year + 1
            else:
                next_month, next_year = current_month + 1, current_year

            if expiry_type == "current_week":
                # Nearest expiry
                if sorted_expiries:
                    return self._format_expiry_for_api(sorted_expiries[0])
                self.log(f"No current week expiry found for {symbol}", "error")
                return None

            elif expiry_type == "next_week":
                # Second nearest expiry
                if len(sorted_expiries) > 1:
                    return self._format_expiry_for_api(sorted_expiries[1])
                self.log(f"No next week expiry found for {symbol}", "error")
                return None

            elif expiry_type == "current_month":
                # Last expiry of current calendar month
                result = None
                for exp_str, exp_date in valid_expiries:
                    if exp_date.month == current_month and exp_date.year == current_year:
                        result = exp_str  # Keep updating to get the last one
                if result:
                    return self._format_expiry_for_api(result)
                self.log(f"No current month expiry found for {symbol}", "error")
                return None

            elif expiry_type == "next_month":
                # Last expiry of next calendar month
                result = None
                for exp_str, exp_date in valid_expiries:
                    if exp_date.month == next_month and exp_date.year == next_year:
                        result = exp_str
                if result:
                    return self._format_expiry_for_api(result)
                self.log(f"No next month expiry found for {symbol}", "error")
                return None

            self.log(f"Unknown expiry type: {expiry_type}", "error")
            return None
        except Exception as e:
            self.log(f"Error resolving expiry: {e}", "error")
            return None

    def _format_expiry_for_api(self, expiry_str: str) -> str:
        """Format expiry date for API (e.g., '10-JUL-25' -> '10JUL25')"""
        if not expiry_str:
            return ""
        # Remove dashes and uppercase
        return expiry_str.replace("-", "").upper()

    def _build_strategy_legs(
        self,
        strategy: str,
        action: str,
        quantity: int,
        expiry_date: str,
        product: str = "NRML",
        pricetype: str = "MARKET"
    ) -> List[Dict[str, Any]]:
        """Build legs array based on strategy type

        Each leg includes: offset, option_type, action, quantity, expiry_date, product, pricetype
        """
        buy_action = "BUY"
        sell_action = "SELL"

        def make_leg(offset: str, option_type: str, leg_action: str) -> Dict[str, Any]:
            return {
                "offset": offset,
                "option_type": option_type,
                "action": leg_action,
                "quantity": quantity,
                "expiry_date": expiry_date,
                "product": product,
                "pricetype": pricetype,
                "splitsize": 0
            }

        if strategy == "straddle":
            # ATM CE + ATM PE (same action)
            return [
                make_leg("ATM", "CE", action),
                make_leg("ATM", "PE", action),
            ]

        elif strategy == "strangle":
            # OTM CE + OTM PE (same action)
            return [
                make_leg("OTM2", "CE", action),
                make_leg("OTM2", "PE", action),
            ]

        elif strategy == "iron_condor":
            # Sell OTM CE + Sell OTM PE + Buy further OTM CE + Buy further OTM PE
            if action == "SELL":
                return [
                    make_leg("OTM5", "CE", sell_action),
                    make_leg("OTM5", "PE", sell_action),
                    make_leg("OTM10", "CE", buy_action),
                    make_leg("OTM10", "PE", buy_action),
                ]
            else:
                return [
                    make_leg("OTM5", "CE", buy_action),
                    make_leg("OTM5", "PE", buy_action),
                    make_leg("OTM10", "CE", sell_action),
                    make_leg("OTM10", "PE", sell_action),
                ]

        elif strategy == "iron_butterfly":
            # Sell ATM CE + Sell ATM PE + Buy OTM CE + Buy OTM PE
            if action == "SELL":
                return [
                    make_leg("ATM", "CE", sell_action),
                    make_leg("ATM", "PE", sell_action),
                    make_leg("OTM3", "CE", buy_action),
                    make_leg("OTM3", "PE", buy_action),
                ]
            else:
                return [
                    make_leg("ATM", "CE", buy_action),
                    make_leg("ATM", "PE", buy_action),
                    make_leg("OTM3", "CE", sell_action),
                    make_leg("OTM3", "PE", sell_action),
                ]

        elif strategy == "bull_call_spread":
            # Buy lower strike CE + Sell higher strike CE
            return [
                make_leg("ATM", "CE", buy_action),
                make_leg("OTM3", "CE", sell_action),
            ]

        elif strategy == "bear_put_spread":
            # Buy higher strike PE + Sell lower strike PE
            return [
                make_leg("ATM", "PE", buy_action),
                make_leg("OTM3", "PE", sell_action),
            ]

        elif strategy == "bull_put_spread":
            # Sell higher strike PE + Buy lower strike PE
            return [
                make_leg("ATM", "PE", sell_action),
                make_leg("OTM3", "PE", buy_action),
            ]

        elif strategy == "bear_call_spread":
            # Sell lower strike CE + Buy higher strike CE
            return [
                make_leg("ATM", "CE", sell_action),
                make_leg("OTM3", "CE", buy_action),
            ]

        return []

    def execute_basket_order(self, node_data: dict) -> dict:
        """Execute Basket Order node"""
        orders = node_data.get("orders", [])
        self.log(f"Placing basket order with {len(orders)} orders")
        result = self.client.basket_order(orders=orders)
        self.log(
            f"Basket order result: {result}",
            "info" if result.get("status") == "success" else "error",
        )
        self.store_output(node_data, result)
        return result

    def execute_split_order(self, node_data: dict) -> dict:
        """Execute Split Order node - supports {{variable}} interpolation"""
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        action = self.get_str(node_data, "action", "BUY")
        quantity = self.get_int(node_data, "quantity", 1)
        split_size = self.get_int(node_data, "splitSize", 10)
        price_type = self.get_str(node_data, "priceType", "MARKET")
        product = self.get_str(node_data, "product", "MIS")

        self.log(f"Placing split order: {symbol} qty={quantity} split={split_size}")
        result = self.client.split_order(
            symbol=symbol,
            exchange=exchange,
            action=action,
            quantity=quantity,
            splitsize=split_size,
            price_type=price_type,
            product=product,
        )
        self.log(
            f"Split order result: {result}",
            "info" if result.get("status") == "success" else "error",
        )
        self.store_output(node_data, result)
        return result

    def execute_modify_order(self, node_data: dict) -> dict:
        """Execute Modify Order node"""
        order_id = self.context.interpolate(str(node_data.get("orderId", "")))
        self.log(f"Modifying order: {order_id}")
        result = self.client.modify_order(
            order_id=order_id,
            symbol=node_data.get("symbol", ""),
            exchange=node_data.get("exchange", "NSE"),
            action=node_data.get("action", "BUY"),
            quantity=int(node_data.get("quantity", 1)),
            price_type=node_data.get("priceType", "LIMIT"),
            product=node_data.get("product", "MIS"),
            price=float(node_data.get("price", 0)),
            trigger_price=float(node_data.get("triggerPrice", 0)),
        )
        self.log(
            f"Modify order result: {result}",
            "info" if result.get("status") == "success" else "error",
        )
        return result

    def execute_cancel_order(self, node_data: dict) -> dict:
        """Execute Cancel Order node"""
        order_id = self.context.interpolate(str(node_data.get("orderId", "")))
        self.log(f"Cancelling order: {order_id}")
        result = self.client.cancel_order(order_id=order_id)
        self.log(
            f"Cancel order result: {result}",
            "info" if result.get("status") == "success" else "error",
        )
        return result

    def execute_cancel_all_orders(self, node_data: dict) -> dict:
        """Execute Cancel All Orders node"""
        self.log("Cancelling all orders")
        result = self.client.cancel_all_orders()
        self.log(
            f"Cancel all result: {result}",
            "info" if result.get("status") == "success" else "error",
        )
        return result

    def execute_close_positions(self, node_data: dict) -> dict:
        """Execute Close Positions node"""
        self.log("Closing all positions")
        result = self.client.close_position()
        self.log(
            f"Close positions result: {result}",
            "info" if result.get("status") == "success" else "error",
        )
        return result

    def execute_get_quote(self, node_data: dict) -> dict:
        """Execute Get Quote node - supports {{variable}} interpolation"""
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        self.log(f"Getting quote for: {symbol} ({exchange})")
        result = self.client.get_quotes(symbol=symbol, exchange=exchange)
        self.log(f"Quote result: {result}")
        self.store_output(node_data, result)
        return result

    def execute_multi_quotes(self, node_data: dict) -> dict:
        """Execute Multi Quotes node"""
        symbols = node_data.get("symbols", [])
        self.log(f"Getting quotes for {len(symbols)} symbols")
        result = self.client.get_multi_quotes(symbols=symbols)
        self.log(f"Multi quotes result: {result}")
        self.store_output(node_data, result)
        return result

    def execute_get_depth(self, node_data: dict) -> dict:
        """Execute Get Depth node - supports {{variable}} interpolation"""
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        self.log(f"Getting depth for: {symbol} ({exchange})")
        result = self.client.get_depth(symbol=symbol, exchange=exchange)
        self.log(f"Depth result received")
        self.store_output(node_data, result)
        return result

    def execute_get_order_status(self, node_data: dict) -> dict:
        """Execute Get Order Status node"""
        order_id = self.context.interpolate(str(node_data.get("orderId", "")))
        self.log(f"Getting order status for: {order_id}")
        result = self.client.get_order_status(order_id=order_id)
        self.log(f"Order status result: {result}")
        self.store_output(node_data, result)
        return result

    def execute_open_position(self, node_data: dict) -> dict:
        """Execute Open Position node - supports {{variable}} interpolation"""
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        product = self.get_str(node_data, "product", "MIS")
        self.log(f"Getting open position for: {symbol}")
        result = self.client.get_open_position(
            symbol=symbol, exchange=exchange, product=product
        )
        self.log(f"Open position result: {result}")
        self.store_output(node_data, result)
        return result

    def execute_history(self, node_data: dict) -> dict:
        """Execute History node - supports {{variable}} interpolation"""
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        interval = self.get_str(node_data, "interval", "5m")
        start_date = self.get_str(node_data, "startDate", "")
        end_date = self.get_str(node_data, "endDate", "")
        self.log(f"Getting history for: {symbol} ({interval})")
        result = self.client.get_history(
            symbol=symbol,
            exchange=exchange,
            interval=interval,
            start_date=start_date,
            end_date=end_date,
        )
        self.log(f"History data received")
        self.store_output(node_data, {"status": "success", "data": str(result)})
        return {"status": "success", "data": result}

    def execute_expiry(self, node_data: dict) -> dict:
        """Execute Expiry node - supports {{variable}} interpolation"""
        symbol = self.get_str(node_data, "symbol", "NIFTY")
        exchange = self.get_str(node_data, "exchange", "NFO")
        instrument_type = self.get_str(node_data, "instrumentType", "options")
        self.log(f"Getting expiry dates for: {symbol}")
        result = self.client.get_expiry(
            symbol=symbol, exchange=exchange, instrumenttype=instrument_type
        )
        self.log(f"Expiry result: {result}")
        self.store_output(node_data, result)
        return result

    def execute_symbol(self, node_data: dict) -> dict:
        """Execute Symbol node - get symbol info (lotsize, tick_size, etc.)"""
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        self.log(f"Getting symbol info for: {symbol} ({exchange})")
        result = self.client.symbol(symbol=symbol, exchange=exchange)
        self.log(f"Symbol result: {result}")
        self.store_output(node_data, result)
        return result

    def execute_option_symbol(self, node_data: dict) -> dict:
        """Execute OptionSymbol node - resolve option symbol from underlying"""
        underlying = self.get_str(node_data, "underlying", "NIFTY")
        exchange = self.get_str(node_data, "exchange", "NSE_INDEX")
        expiry_date = self.get_str(node_data, "expiryDate", "")
        offset = self.get_str(node_data, "offset", "ATM")
        option_type = self.get_str(node_data, "optionType", "CE")
        self.log(f"Resolving option symbol: {underlying} {option_type} {offset}")
        result = self.client.optionsymbol(
            underlying=underlying,
            exchange=exchange,
            expiry_date=expiry_date,
            offset=offset,
            option_type=option_type
        )
        self.log(f"Option symbol result: {result}")
        self.store_output(node_data, result)
        return result

    def execute_order_book(self, node_data: dict) -> dict:
        """Execute OrderBook node - get all orders for the day"""
        self.log("Fetching order book")
        result = self.client.orderbook()
        self.log(f"Order book: {len(result.get('data', []))} orders")
        self.store_output(node_data, result)
        return result

    def execute_trade_book(self, node_data: dict) -> dict:
        """Execute TradeBook node - get all trades for the day"""
        self.log("Fetching trade book")
        result = self.client.tradebook()
        self.log(f"Trade book: {len(result.get('data', []))} trades")
        self.store_output(node_data, result)
        return result

    def execute_position_book(self, node_data: dict) -> dict:
        """Execute PositionBook node - get all positions"""
        self.log("Fetching position book")
        result = self.client.positionbook()
        self.log(f"Position book: {len(result.get('data', []))} positions")
        self.store_output(node_data, result)
        return result

    def execute_synthetic_future(self, node_data: dict) -> dict:
        """Execute SyntheticFuture node - calculate synthetic future price"""
        underlying = self.get_str(node_data, "underlying", "NIFTY")
        exchange = self.get_str(node_data, "exchange", "NSE_INDEX")
        expiry_date = self.get_str(node_data, "expiryDate", "")
        self.log(f"Calculating synthetic future for: {underlying}")
        result = self.client.syntheticfuture(
            underlying=underlying,
            exchange=exchange,
            expiry_date=expiry_date
        )
        self.log(f"Synthetic future result: {result}")
        self.store_output(node_data, result)
        return result

    def execute_option_chain(self, node_data: dict) -> dict:
        """Execute OptionChain node - get option chain data"""
        underlying = self.get_str(node_data, "underlying", "NIFTY")
        exchange = self.get_str(node_data, "exchange", "NSE_INDEX")
        expiry_date = self.get_str(node_data, "expiryDate", "")
        strike_count = self.get_int(node_data, "strikeCount", 10)
        self.log(f"Fetching option chain for: {underlying} expiry={expiry_date}")
        result = self.client.optionchain(
            underlying=underlying,
            exchange=exchange,
            expiry_date=expiry_date,
            strike_count=strike_count
        )
        self.log(f"Option chain result received")
        self.store_output(node_data, result)
        return result

    def execute_holidays(self, node_data: dict) -> dict:
        """Execute Holidays node - get market holidays for a year"""
        year = self.get_str(node_data, "year", str(datetime.now().year))
        self.log(f"Fetching holidays for year: {year}")
        result = self.client.holidays(year=year)
        self.log(f"Holidays: {len(result.get('data', []))} holidays")
        self.store_output(node_data, result)
        return result

    def execute_timings(self, node_data: dict) -> dict:
        """Execute Timings node - get market timings for a date"""
        date = self.get_str(node_data, "date", datetime.now().strftime("%Y-%m-%d"))
        self.log(f"Fetching market timings for: {date}")
        result = self.client.timings(date=date)
        self.log(f"Timings result: {result}")
        self.store_output(node_data, result)
        return result

    # ===== WEBSOCKET STREAMING NODES =====
    # Note: WebSocket streaming is async/continuous. For workflow execution,
    # these nodes fetch the current/latest data from the stream.
    # For true real-time streaming, use the REST API quotes() as fallback.

    def execute_subscribe_ltp(self, node_data: dict) -> dict:
        """Execute Subscribe LTP node - get real-time LTP data

        Since workflow execution is sequential, we fetch the current LTP
        via the quotes API which provides real-time data.
        """
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        self.log(f"Subscribing to LTP stream: {symbol} ({exchange})")

        try:
            # Use quotes API to get real-time LTP
            quote_data = self.client.get_quotes(symbol=symbol, exchange=exchange)
            ltp = quote_data.get("data", {}).get("ltp", 0)

            result = {
                "status": "success",
                "type": "ltp",
                "symbol": symbol,
                "exchange": exchange,
                "ltp": ltp,
                "data": quote_data.get("data", {})
            }

            # Store LTP directly for easy access via {{ltp}} or {{outputVar}}
            output_var = node_data.get("outputVariable", "ltp")
            self.context.set_variable(output_var, ltp)
            self.log(f"LTP for {symbol}: {ltp}")

        except Exception as e:
            self.log(f"Failed to get LTP: {e}", "error")
            result = {
                "status": "error",
                "type": "ltp",
                "symbol": symbol,
                "exchange": exchange,
                "error": str(e)
            }

        self.store_output(node_data, result)
        return result

    def execute_subscribe_quote(self, node_data: dict) -> dict:
        """Execute Subscribe Quote node - get real-time quote data (OHLC + volume)"""
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        self.log(f"Subscribing to Quote stream: {symbol} ({exchange})")

        try:
            # Use quotes API to get real-time quote data
            quote_data = self.client.get_quotes(symbol=symbol, exchange=exchange)
            data = quote_data.get("data", {})

            result = {
                "status": "success",
                "type": "quote",
                "symbol": symbol,
                "exchange": exchange,
                "ltp": data.get("ltp", 0),
                "open": data.get("open", 0),
                "high": data.get("high", 0),
                "low": data.get("low", 0),
                "volume": data.get("volume", 0),
                "bid": data.get("bid", 0),
                "ask": data.get("ask", 0),
                "prev_close": data.get("prev_close", 0),
                "data": data
            }

            self.log(f"Quote for {symbol}: LTP={data.get('ltp', 0)}")

        except Exception as e:
            self.log(f"Failed to get Quote: {e}", "error")
            result = {
                "status": "error",
                "type": "quote",
                "symbol": symbol,
                "exchange": exchange,
                "error": str(e)
            }

        self.store_output(node_data, result)
        return result

    def execute_subscribe_depth(self, node_data: dict) -> dict:
        """Execute Subscribe Depth node - get real-time depth data (order book)"""
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        self.log(f"Subscribing to Depth stream: {symbol} ({exchange})")

        try:
            # Use depth API to get real-time order book
            depth_data = self.client.get_depth(symbol=symbol, exchange=exchange)
            data = depth_data.get("data", {})

            result = {
                "status": "success",
                "type": "depth",
                "symbol": symbol,
                "exchange": exchange,
                "bids": data.get("bids", []),
                "asks": data.get("asks", []),
                "totalbuyqty": data.get("totalbuyqty", 0),
                "totalsellqty": data.get("totalsellqty", 0),
                "ltp": data.get("ltp", 0),
                "data": data
            }

            self.log(f"Depth for {symbol}: {len(data.get('bids', []))} bids, {len(data.get('asks', []))} asks")

        except Exception as e:
            self.log(f"Failed to get Depth: {e}", "error")
            result = {
                "status": "error",
                "type": "depth",
                "symbol": symbol,
                "exchange": exchange,
                "error": str(e)
            }

        self.store_output(node_data, result)
        return result

    def execute_unsubscribe(self, node_data: dict) -> dict:
        """Execute Unsubscribe node - cleanup (no-op for REST-based approach)"""
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        stream_type = self.get_str(node_data, "streamType", "all")
        self.log(f"Unsubscribing from {stream_type} stream: {symbol or 'all'} ({exchange})")

        result = {
            "status": "unsubscribed",
            "type": stream_type,
            "symbol": symbol or "all",
            "exchange": exchange
        }
        return result

    # ===== RISK MANAGEMENT NODES =====
    def execute_holdings(self, node_data: dict) -> dict:
        """Execute Holdings node - get portfolio holdings"""
        self.log("Fetching portfolio holdings")
        result = self.client.holdings()
        holdings_count = len(result.get("data", {}).get("holdings", []))
        self.log(f"Holdings: {holdings_count} holdings")
        self.store_output(node_data, result)
        return result

    def execute_funds(self, node_data: dict) -> dict:
        """Execute Funds node - get account funds"""
        self.log("Fetching account funds")
        result = self.client.funds()
        available = result.get("data", {}).get("availablecash", "0")
        self.log(f"Available cash: {available}")
        self.store_output(node_data, result)
        return result

    def execute_margin(self, node_data: dict) -> dict:
        """Execute Margin node - calculate margin requirements"""
        positions = node_data.get("positions", [])
        self.log(f"Calculating margin for {len(positions)} positions")
        result = self.client.margin(positions=positions)
        margin_required = result.get("data", {}).get("total_margin_required", 0)
        self.log(f"Total margin required: {margin_required}")
        self.store_output(node_data, result)
        return result

    def execute_telegram_alert(self, node_data: dict) -> dict:
        """Execute Telegram Alert node"""
        username = node_data.get("username", "")
        message = self.context.interpolate(node_data.get("message", ""))
        self.log(f"Sending Telegram alert to {username}: {message}")
        result = self.client.send_telegram(username=username, message=message)
        self.log(
            f"Telegram result: {result}",
            "info" if result.get("status") == "success" else "error",
        )
        return result

    def execute_http_request(self, node_data: dict) -> dict:
        """Execute HTTP Request node - make external API calls

        Supports GET, POST, PUT, DELETE, PATCH methods with custom headers and body.
        Response is stored in output variable for use in subsequent nodes.
        """
        import requests

        method = self.get_str(node_data, "method", "GET").upper()
        url = self.get_str(node_data, "url", "")
        headers_raw = node_data.get("headers", {})
        body = node_data.get("body", "")
        timeout = self.get_int(node_data, "timeout", 30)
        content_type = self.get_str(node_data, "contentType", "application/json")

        if not url:
            self.log("HTTP Request: No URL specified", "error")
            return {"status": "error", "message": "No URL specified"}

        # Process headers (interpolate variables)
        headers = {}
        if isinstance(headers_raw, dict):
            for key, value in headers_raw.items():
                headers[key] = self.context.interpolate(str(value)) if self.context else str(value)
        elif isinstance(headers_raw, str) and headers_raw:
            # Try to parse as JSON
            try:
                import json
                headers = json.loads(headers_raw)
            except:
                pass

        # Add content type if not present
        if "Content-Type" not in headers and content_type:
            headers["Content-Type"] = content_type

        # Interpolate URL and body
        url = self.context.interpolate(url) if self.context else url
        if isinstance(body, str) and body:
            body = self.context.interpolate(body) if self.context else body

        self.log(f"HTTP {method} {url}")

        try:
            # Make the request based on method
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == "POST":
                if content_type == "application/json" and isinstance(body, str):
                    try:
                        import json
                        body = json.loads(body)
                        response = requests.post(url, json=body, headers=headers, timeout=timeout)
                    except:
                        response = requests.post(url, data=body, headers=headers, timeout=timeout)
                else:
                    response = requests.post(url, data=body, headers=headers, timeout=timeout)
            elif method == "PUT":
                if content_type == "application/json" and isinstance(body, str):
                    try:
                        import json
                        body = json.loads(body)
                        response = requests.put(url, json=body, headers=headers, timeout=timeout)
                    except:
                        response = requests.put(url, data=body, headers=headers, timeout=timeout)
                else:
                    response = requests.put(url, data=body, headers=headers, timeout=timeout)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=timeout)
            elif method == "PATCH":
                if content_type == "application/json" and isinstance(body, str):
                    try:
                        import json
                        body = json.loads(body)
                        response = requests.patch(url, json=body, headers=headers, timeout=timeout)
                    except:
                        response = requests.patch(url, data=body, headers=headers, timeout=timeout)
                else:
                    response = requests.patch(url, data=body, headers=headers, timeout=timeout)
            else:
                self.log(f"HTTP Request: Unsupported method '{method}'", "error")
                return {"status": "error", "message": f"Unsupported method: {method}"}

            # Parse response
            try:
                response_data = response.json()
            except:
                response_data = response.text

            result = {
                "status": "success" if response.ok else "error",
                "statusCode": response.status_code,
                "data": response_data,
                "headers": dict(response.headers),
            }

            self.log(f"HTTP Response: {response.status_code}")
            self.store_output(node_data, result)

            return result

        except requests.exceptions.Timeout:
            self.log(f"HTTP Request timed out after {timeout}s", "error")
            return {"status": "error", "message": f"Request timed out after {timeout}s"}
        except requests.exceptions.RequestException as e:
            self.log(f"HTTP Request failed: {str(e)}", "error")
            return {"status": "error", "message": str(e)}

    def execute_delay(self, node_data: dict) -> dict:
        """Execute Delay node - supports seconds, minutes, hours"""
        import time as time_module

        # New format: delayValue + delayUnit
        delay_value = node_data.get("delayValue")
        delay_unit = node_data.get("delayUnit", "seconds")

        if delay_value is not None:
            delay_value = int(delay_value)
            # Convert to seconds based on unit
            if delay_unit == "minutes":
                delay_seconds = delay_value * 60
                display = f"{delay_value} minute(s)"
            elif delay_unit == "hours":
                delay_seconds = delay_value * 3600
                display = f"{delay_value} hour(s)"
            else:  # seconds
                delay_seconds = delay_value
                display = f"{delay_value} second(s)"
        else:
            # Backward compatibility: old delayMs format
            delay_ms = int(node_data.get("delayMs", 1000))
            delay_seconds = delay_ms / 1000
            display = f"{delay_ms}ms"

        self.log(f"Waiting for {display}")
        time_module.sleep(delay_seconds)
        self.log(f"Delay complete")
        return {"status": "success", "message": f"Waited {display}"}

    def execute_wait_until(self, node_data: dict) -> dict:
        """Execute Wait Until node - pauses until target time is reached

        Used for time-based entry/exit strategies like BuildAlgos.
        """
        import time as time_module

        target_time_str = node_data.get("targetTime", "09:30")
        check_interval_ms = int(node_data.get("checkIntervalMs", 1000))

        # Use safe time parsing
        target_hour, target_minute, target_second = parse_time_string(target_time_str, 9, 30)
        target_time = time(target_hour, target_minute, target_second)

        now = datetime.now().time()
        now_seconds = now.hour * 3600 + now.minute * 60 + now.second
        target_seconds = target_time.hour * 3600 + target_time.minute * 60 + target_time.second

        # If target time has already passed today, continue immediately
        if now_seconds >= target_seconds:
            self.log(
                f"Wait Until: Target time {target_time_str} has already passed (current: {now.strftime('%H:%M:%S')}), continuing..."
            )
            return {
                "status": "success",
                "message": f"Target time {target_time_str} already passed",
                "current_time": now.strftime("%H:%M:%S"),
                "target_time": target_time_str,
                "waited": False,
            }

        # Calculate wait duration
        wait_seconds = target_seconds - now_seconds
        self.log(
            f"Wait Until: Waiting for {target_time_str} (current: {now.strftime('%H:%M:%S')}, ~{wait_seconds}s remaining)"
        )

        # Wait in intervals, checking time periodically
        check_interval_sec = check_interval_ms / 1000
        while True:
            now = datetime.now().time()
            now_seconds = now.hour * 3600 + now.minute * 60 + now.second

            if now_seconds >= target_seconds:
                break

            # Sleep for the check interval or remaining time, whichever is smaller
            remaining = target_seconds - now_seconds
            sleep_time = min(check_interval_sec, remaining)
            time_module.sleep(sleep_time)

        self.log(f"Wait Until: Target time {target_time_str} reached!")
        return {
            "status": "success",
            "message": f"Waited until {target_time_str}",
            "current_time": datetime.now().strftime("%H:%M:%S"),
            "target_time": target_time_str,
            "waited": True,
        }

    def execute_log(self, node_data: dict) -> dict:
        """Execute Log node"""
        message = self.context.interpolate(node_data.get("message", ""))
        log_level = node_data.get("level", "info")
        self.log(f"[LOG] {message}", log_level)
        return {"status": "success", "message": message}

    def execute_variable(self, node_data: dict) -> dict:
        """Execute Variable node with various operations

        Supported operations:
        - set: Set variable to a value
        - get: Get a variable value (and optionally store in another)
        - add: Add a number to variable
        - subtract: Subtract a number from variable
        - multiply: Multiply variable by a number
        - divide: Divide variable by a number
        - increment: Add 1 to variable
        - decrement: Subtract 1 from variable
        - append: Append string to variable
        - parse_json: Parse JSON string into object
        - stringify: Convert object to JSON string
        """
        # Frontend uses 'variableName', fallback to 'name' for compatibility
        var_name = node_data.get("variableName") or node_data.get("name", "")
        operation = node_data.get("operation", "set")
        var_value = node_data.get("value", "")
        source_var = node_data.get("sourceVariable", "")

        # Interpolate string values
        if isinstance(var_value, str):
            var_value = self.context.interpolate(var_value)

        try:
            if operation == "set":
                # Try to parse as JSON if it looks like JSON
                if isinstance(var_value, str):
                    if var_value.startswith("{") or var_value.startswith("["):
                        try:
                            var_value = json.loads(var_value)
                        except json.JSONDecodeError:
                            pass
                self.context.set_variable(var_name, var_value)
                self.log(f"Set variable {var_name} = {var_value}")

            elif operation == "get":
                # Get value from source variable and store in target
                source_value = self.context.get_variable(source_var, "")
                if var_name:
                    self.context.set_variable(var_name, source_value)
                    self.log(f"Copied {source_var} to {var_name}")
                return {"status": "success", "variable": var_name, "value": source_value}

            elif operation == "add":
                current = self.context.get_variable(var_name, 0)
                try:
                    current_num = float(current) if current else 0
                    add_value = float(var_value) if var_value else 0
                    result = current_num + add_value
                    self.context.set_variable(var_name, result)
                    self.log(f"Added {add_value} to {var_name}: {result}")
                    var_value = result
                except (ValueError, TypeError) as e:
                    self.log(f"Add operation failed: {e}", "error")
                    return {"status": "error", "message": str(e)}

            elif operation == "subtract":
                current = self.context.get_variable(var_name, 0)
                try:
                    current_num = float(current) if current else 0
                    sub_value = float(var_value) if var_value else 0
                    result = current_num - sub_value
                    self.context.set_variable(var_name, result)
                    self.log(f"Subtracted {sub_value} from {var_name}: {result}")
                    var_value = result
                except (ValueError, TypeError) as e:
                    self.log(f"Subtract operation failed: {e}", "error")
                    return {"status": "error", "message": str(e)}

            elif operation == "multiply":
                current = self.context.get_variable(var_name, 0)
                try:
                    current_num = float(current) if current else 0
                    mul_value = float(var_value) if var_value else 1
                    result = current_num * mul_value
                    self.context.set_variable(var_name, result)
                    self.log(f"Multiplied {var_name} by {mul_value}: {result}")
                    var_value = result
                except (ValueError, TypeError) as e:
                    self.log(f"Multiply operation failed: {e}", "error")
                    return {"status": "error", "message": str(e)}

            elif operation == "divide":
                current = self.context.get_variable(var_name, 0)
                try:
                    current_num = float(current) if current else 0
                    div_value = float(var_value) if var_value else 1
                    if div_value == 0:
                        self.log(f"Division by zero error", "error")
                        return {"status": "error", "message": "Division by zero"}
                    result = current_num / div_value
                    self.context.set_variable(var_name, result)
                    self.log(f"Divided {var_name} by {div_value}: {result}")
                    var_value = result
                except (ValueError, TypeError) as e:
                    self.log(f"Divide operation failed: {e}", "error")
                    return {"status": "error", "message": str(e)}

            elif operation == "increment":
                current = self.context.get_variable(var_name, 0)
                try:
                    current_num = float(current) if current else 0
                    result = current_num + 1
                    self.context.set_variable(var_name, result)
                    self.log(f"Incremented {var_name}: {result}")
                    var_value = result
                except (ValueError, TypeError) as e:
                    self.log(f"Increment operation failed: {e}", "error")
                    return {"status": "error", "message": str(e)}

            elif operation == "decrement":
                current = self.context.get_variable(var_name, 0)
                try:
                    current_num = float(current) if current else 0
                    result = current_num - 1
                    self.context.set_variable(var_name, result)
                    self.log(f"Decremented {var_name}: {result}")
                    var_value = result
                except (ValueError, TypeError) as e:
                    self.log(f"Decrement operation failed: {e}", "error")
                    return {"status": "error", "message": str(e)}

            elif operation == "append":
                current = self.context.get_variable(var_name, "")
                result = str(current) + str(var_value)
                self.context.set_variable(var_name, result)
                self.log(f"Appended to {var_name}: {result}")
                var_value = result

            elif operation == "parse_json":
                try:
                    parsed = json.loads(str(var_value))
                    self.context.set_variable(var_name, parsed)
                    self.log(f"Parsed JSON into {var_name}")
                    var_value = parsed
                except json.JSONDecodeError as e:
                    self.log(f"JSON parse failed: {e}", "error")
                    return {"status": "error", "message": f"Invalid JSON: {e}"}

            elif operation == "stringify":
                source_value = self.context.get_variable(source_var, {})
                result = json.dumps(source_value)
                self.context.set_variable(var_name, result)
                self.log(f"Stringified {source_var} into {var_name}")
                var_value = result

            else:
                self.log(f"Unknown variable operation: {operation}", "warning")
                return {"status": "error", "message": f"Unknown operation: {operation}"}

            return {"status": "success", "variable": var_name, "value": var_value, "operation": operation}

        except Exception as e:
            self.log(f"Variable operation failed: {e}", "error")
            return {"status": "error", "message": str(e)}

    def execute_position_check(self, node_data: dict) -> dict:
        """Execute Position Check node - supports {{variable}} interpolation"""
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        product = self.get_str(node_data, "product", "MIS")
        operator = self.get_str(node_data, "operator", "gt")
        threshold = self.get_int(node_data, "threshold", 0)

        self.log(f"Checking position for: {symbol}")
        result = self.client.get_open_position(
            symbol=symbol, exchange=exchange, product=product
        )

        quantity = int(result.get("quantity", 0))
        condition_met = self._evaluate_condition(quantity, operator, threshold)

        self.log(
            f"Position check: qty={quantity} {operator} {threshold} = {condition_met}"
        )
        return {"status": "success", "condition": condition_met, "quantity": quantity}

    def execute_fund_check(self, node_data: dict) -> dict:
        """Execute Fund Check node - supports {{variable}} interpolation"""
        operator = self.get_str(node_data, "operator", "gt")
        threshold = self.get_float(node_data, "threshold", 0)

        self.log("Checking funds")
        result = self.client.get_funds()

        available = float(result.get("data", {}).get("availablecash", 0))
        condition_met = self._evaluate_condition(available, operator, threshold)

        self.log(
            f"Fund check: available={available} {operator} {threshold} = {condition_met}"
        )
        return {
            "status": "success",
            "condition": condition_met,
            "available": available,
        }

    def execute_price_condition(self, node_data: dict) -> dict:
        """Execute Price Condition node - supports {{variable}} interpolation"""
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        operator = self.get_str(node_data, "operator", "gt")
        threshold = self.get_float(node_data, "threshold", 0)

        self.log(f"Checking price condition for: {symbol}")
        result = self.client.get_quotes(symbol=symbol, exchange=exchange)

        ltp = float(result.get("data", {}).get("ltp", 0))
        condition_met = self._evaluate_condition(ltp, operator, threshold)

        self.log(f"Price check: ltp={ltp} {operator} {threshold} = {condition_met}")
        return {"status": "success", "condition": condition_met, "ltp": ltp}

    def execute_price_alert(self, node_data: dict) -> dict:
        """Execute Price Alert trigger node - checks if price condition is met

        Uses the quotes() API to fetch current LTP and compare against threshold.
        Returns condition=True if alert should trigger (follows Yes path).
        """
        symbol = self.get_str(node_data, "symbol", "")
        exchange = self.get_str(node_data, "exchange", "NSE")
        condition_type = self.get_str(node_data, "condition", "greater_than")
        price = self.get_float(node_data, "price", 0)
        price_lower = self.get_float(node_data, "priceLower", 0)
        price_upper = self.get_float(node_data, "priceUpper", 0)
        percentage = self.get_float(node_data, "percentage", 0)

        if not symbol:
            self.log("Price alert: No symbol specified", "error")
            return {"status": "error", "condition": False, "message": "No symbol specified"}

        # Fetch current quote using SDK
        self.log(f"Price alert: Fetching quote for {symbol} ({exchange})")
        result = self.client.get_quotes(symbol=symbol, exchange=exchange)

        if result.get("status") != "success":
            self.log(f"Price alert: Failed to fetch quote - {result}", "error")
            return {"status": "error", "condition": False, "message": "Failed to fetch quote"}

        data = result.get("data", {})
        ltp = float(data.get("ltp", 0))
        prev_close = float(data.get("prev_close", ltp))

        condition_met = False

        # Evaluate condition based on type
        if condition_type == "greater_than":
            condition_met = ltp > price
            self.log(f"Price alert: {symbol} LTP={ltp} > {price} = {condition_met}")

        elif condition_type == "less_than":
            condition_met = ltp < price
            self.log(f"Price alert: {symbol} LTP={ltp} < {price} = {condition_met}")

        elif condition_type == "crossing":
            # Crossing means price is at or very close to target (within 0.1%)
            tolerance = price * 0.001
            condition_met = abs(ltp - price) <= tolerance
            self.log(f"Price alert: {symbol} LTP={ltp} crossing {price} = {condition_met}")

        elif condition_type == "crossing_up":
            # Price crossed above threshold (ltp > price and prev was below or equal)
            condition_met = ltp > price
            self.log(f"Price alert: {symbol} LTP={ltp} crossing up {price} = {condition_met}")

        elif condition_type == "crossing_down":
            # Price crossed below threshold
            condition_met = ltp < price
            self.log(f"Price alert: {symbol} LTP={ltp} crossing down {price} = {condition_met}")

        elif condition_type == "entering_channel":
            # Price entered the channel (between lower and upper)
            condition_met = price_lower <= ltp <= price_upper
            self.log(f"Price alert: {symbol} LTP={ltp} in channel [{price_lower}, {price_upper}] = {condition_met}")

        elif condition_type == "exiting_channel":
            # Price exited the channel
            condition_met = ltp < price_lower or ltp > price_upper
            self.log(f"Price alert: {symbol} LTP={ltp} outside channel [{price_lower}, {price_upper}] = {condition_met}")

        elif condition_type == "inside_channel":
            condition_met = price_lower <= ltp <= price_upper
            self.log(f"Price alert: {symbol} LTP={ltp} inside [{price_lower}, {price_upper}] = {condition_met}")

        elif condition_type == "outside_channel":
            condition_met = ltp < price_lower or ltp > price_upper
            self.log(f"Price alert: {symbol} LTP={ltp} outside [{price_lower}, {price_upper}] = {condition_met}")

        elif condition_type == "moving_up":
            # Price moved up from previous close
            condition_met = ltp > prev_close
            self.log(f"Price alert: {symbol} LTP={ltp} > prev_close={prev_close} = {condition_met}")

        elif condition_type == "moving_down":
            # Price moved down from previous close
            condition_met = ltp < prev_close
            self.log(f"Price alert: {symbol} LTP={ltp} < prev_close={prev_close} = {condition_met}")

        elif condition_type == "moving_up_percent":
            # Price moved up by X% from previous close
            if prev_close > 0:
                change_percent = ((ltp - prev_close) / prev_close) * 100
                condition_met = change_percent >= percentage
                self.log(f"Price alert: {symbol} change={change_percent:.2f}% >= {percentage}% = {condition_met}")
            else:
                condition_met = False

        elif condition_type == "moving_down_percent":
            # Price moved down by X% from previous close
            if prev_close > 0:
                change_percent = ((prev_close - ltp) / prev_close) * 100
                condition_met = change_percent >= percentage
                self.log(f"Price alert: {symbol} down {change_percent:.2f}% >= {percentage}% = {condition_met}")
            else:
                condition_met = False

        else:
            self.log(f"Price alert: Unknown condition type '{condition_type}'", "warning")

        # Store the quote data as output variable
        self.store_output(node_data, {
            "status": "success",
            "ltp": ltp,
            "prev_close": prev_close,
            "condition_met": condition_met,
            "symbol": symbol,
            "exchange": exchange,
        })

        return {
            "status": "success",
            "condition": condition_met,
            "ltp": ltp,
            "prev_close": prev_close,
        }

    def execute_time_window(self, node_data: dict) -> dict:
        """Execute Time Window node - returns True/False for condition"""
        start_time_str = node_data.get("startTime", "09:15")
        end_time_str = node_data.get("endTime", "15:30")

        now = datetime.now().time()

        # Use safe time parsing
        start_h, start_m, start_s = parse_time_string(start_time_str, 9, 15)
        end_h, end_m, end_s = parse_time_string(end_time_str, 15, 30)

        start_time = time(start_h, start_m, start_s)
        end_time = time(end_h, end_m, end_s)

        condition_met = start_time <= now <= end_time

        self.log(
            f"Time window check: {start_time_str}-{end_time_str}, current={now.strftime('%H:%M')}, in_window={condition_met}"
        )
        return {
            "status": "success",
            "condition": condition_met,
            "current_time": now.strftime("%H:%M:%S"),
        }

    def execute_time_condition(self, node_data: dict) -> dict:
        """Execute Time Condition node - returns True/False for condition

        Used for Entry/Exit time conditions like BuildAlgos:
        - Check if current time equals, passes, or is before a specific time
        """
        target_time_str = node_data.get("targetTime", "09:30")
        operator = node_data.get("operator", ">=")
        condition_type = node_data.get("conditionType", "entry")

        now = datetime.now().time()

        # Use safe time parsing
        target_hour, target_minute, target_second = parse_time_string(target_time_str, 9, 30)
        target_time = time(target_hour, target_minute, target_second)

        # Convert times to comparable values (seconds since midnight)
        now_seconds = now.hour * 3600 + now.minute * 60 + now.second
        target_seconds = target_time.hour * 3600 + target_time.minute * 60 + target_time.second

        # Evaluate condition based on operator
        condition_met = False
        if operator == "==":
            # Check if current time matches (within same minute)
            condition_met = (now.hour == target_time.hour and
                           now.minute == target_time.minute)
        elif operator == ">=":
            condition_met = now_seconds >= target_seconds
        elif operator == "<=":
            condition_met = now_seconds <= target_seconds
        elif operator == ">":
            condition_met = now_seconds > target_seconds
        elif operator == "<":
            condition_met = now_seconds < target_seconds

        self.log(
            f"Time condition ({condition_type}): current={now.strftime('%H:%M:%S')} {operator} target={target_time_str} = {condition_met}"
        )
        return {
            "status": "success",
            "condition": condition_met,
            "condition_type": condition_type,
            "current_time": now.strftime("%H:%M:%S"),
            "target_time": target_time_str,
            "operator": operator,
        }

    def _evaluate_condition(
        self, value: float, operator: str, threshold: float
    ) -> bool:
        """Evaluate a condition"""
        operators = {
            "gt": value > threshold,
            "gte": value >= threshold,
            "lt": value < threshold,
            "lte": value <= threshold,
            "eq": value == threshold,
            "neq": value != threshold,
        }
        return operators.get(operator, False)

    def execute_and_gate(self, node_data: dict, input_results: List[bool]) -> dict:
        """Execute AND Gate - returns True if ALL inputs are True"""
        if not input_results:
            self.log("AND Gate: No input conditions found", "warning")
            return {"status": "success", "condition": False}

        condition_met = all(input_results)
        self.log(f"AND Gate: inputs={input_results} -> {condition_met}")
        return {
            "status": "success",
            "condition": condition_met,
            "inputs": input_results,
            "gate_type": "AND",
        }

    def execute_or_gate(self, node_data: dict, input_results: List[bool]) -> dict:
        """Execute OR Gate - returns True if ANY input is True"""
        if not input_results:
            self.log("OR Gate: No input conditions found", "warning")
            return {"status": "success", "condition": False}

        condition_met = any(input_results)
        self.log(f"OR Gate: inputs={input_results} -> {condition_met}")
        return {
            "status": "success",
            "condition": condition_met,
            "inputs": input_results,
            "gate_type": "OR",
        }

    def execute_not_gate(self, node_data: dict, input_results: List[bool]) -> dict:
        """Execute NOT Gate - inverts the input condition"""
        if not input_results:
            self.log("NOT Gate: No input condition found", "warning")
            return {"status": "success", "condition": True}

        # NOT gate typically has a single input
        input_value = input_results[0] if input_results else False
        condition_met = not input_value
        self.log(f"NOT Gate: input={input_value} -> {condition_met}")
        return {
            "status": "success",
            "condition": condition_met,
            "input": input_value,
            "gate_type": "NOT",
        }


async def execute_workflow(workflow_id: int, webhook_data: Optional[Dict[str, Any]] = None) -> dict:
    """Execute a workflow with concurrent execution protection

    Args:
        workflow_id: The workflow to execute
        webhook_data: Optional data from webhook trigger, accessible via {{webhook.field}}
    """
    # Get the lock for this workflow
    lock = get_workflow_lock(workflow_id)

    # Try to acquire the lock without blocking
    if lock.locked():
        logger.warning(f"Workflow {workflow_id} is already running, skipping execution")
        return {
            "status": "error",
            "message": "Workflow is already running. Please wait for the current execution to complete.",
            "already_running": True,
        }

    async with lock:
        async with async_session_maker() as db:
            result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
            workflow = result.scalar_one_or_none()

            if not workflow:
                return {"status": "error", "message": "Workflow not found"}

            execution = WorkflowExecution(
                workflow_id=workflow_id,
                status="running",
                started_at=datetime.utcnow(),
                logs=[],
            )
            db.add(execution)
            await db.commit()
            await db.refresh(execution)

            logs = []
            context = WorkflowContext()

            # Inject webhook data into context if provided
            if webhook_data:
                context.set_variable("webhook", webhook_data)
                logger.info(f"Webhook data injected: {webhook_data}")

            # Broadcast execution started
            try:
                await broadcast_execution_update(workflow_id, "running", f"Starting workflow: {workflow.name}")
            except Exception as e:
                logger.warning(f"Failed to broadcast execution start: {e}")

            try:
                client = await get_openalgo_client()
                if not client:
                    raise Exception("OpenAlgo not configured")

                executor = NodeExecutor(client, context, logs)
                executor.log(f"Starting workflow: {workflow.name}")

                nodes = workflow.nodes or []
                edges = workflow.edges or []

                start_node = next((n for n in nodes if n.get("type") == "start"), None)
                if not start_node:
                    raise Exception("No start node found")

                # Build edge map for traversal (source -> outgoing edges)
                edge_map: Dict[str, List[dict]] = {}
                # Build reverse edge map (target -> incoming edges) for logic gates
                incoming_edge_map: Dict[str, List[dict]] = {}
                for edge in edges:
                    source = edge["source"]
                    target = edge["target"]
                    if source not in edge_map:
                        edge_map[source] = []
                    edge_map[source].append(edge)
                    if target not in incoming_edge_map:
                        incoming_edge_map[target] = []
                    incoming_edge_map[target].append(edge)

                # Track visited nodes and depth to prevent infinite loops
                visited_count: Dict[str, int] = {}  # Track how many times each node is visited

                # Execute nodes starting from start node
                await execute_node_chain(
                    start_node["id"], nodes, edge_map, incoming_edge_map, executor, context,
                    visited_count=visited_count, depth=0,
                    workflow_id=workflow_id  # Pass workflow_id for broadcasting
                )

                execution.status = "completed"
                execution.completed_at = datetime.utcnow()
                execution.logs = logs
                await db.commit()

                # Broadcast execution completed
                try:
                    await broadcast_execution_update(workflow_id, "completed", "Workflow executed successfully")
                except Exception as e:
                    logger.warning(f"Failed to broadcast execution complete: {e}")

                return {
                    "status": "success",
                    "message": "Workflow executed successfully",
                    "execution_id": execution.id,
                    "logs": logs,
                }

            except Exception as e:
                logger.error(f"Workflow execution failed: {e}")
                logs.append(
                    {
                        "time": datetime.utcnow().isoformat(),
                        "message": f"Error: {str(e)}",
                        "level": "error",
                    }
                )

                execution.status = "failed"
                execution.completed_at = datetime.utcnow()
                execution.error = str(e)
                execution.logs = logs
                await db.commit()

                # Broadcast execution failed
                try:
                    await broadcast_execution_update(workflow_id, "failed", str(e))
                except Exception as broadcast_error:
                    logger.warning(f"Failed to broadcast execution failure: {broadcast_error}")

                return {"status": "error", "message": str(e), "execution_id": execution.id, "logs": logs}


async def execute_node_chain(
    node_id: str,
    nodes: list,
    edge_map: Dict[str, List[dict]],
    incoming_edge_map: Dict[str, List[dict]],
    executor: NodeExecutor,
    context: WorkflowContext,
    visited_count: Dict[str, int] = None,
    depth: int = 0,
    workflow_id: Optional[int] = None,
):
    """Execute a chain of nodes starting from the given node

    Args:
        node_id: The ID of the node to execute
        nodes: List of all nodes in the workflow
        edge_map: Map of source node ID to list of outgoing edges
        incoming_edge_map: Map of target node ID to list of incoming edges (for logic gates)
        executor: The node executor instance
        context: The workflow context for variable storage
        visited_count: Dictionary tracking how many times each node has been visited
        depth: Current recursion depth
        workflow_id: Optional workflow ID for WebSocket broadcasting

    Raises:
        Exception: If max depth or max visits exceeded (infinite loop protection)
    """
    # Initialize visited_count if not provided (backward compatibility)
    if visited_count is None:
        visited_count = {}

    # Check depth limit to prevent stack overflow
    if depth > MAX_NODE_DEPTH:
        raise Exception(
            f"Maximum node depth ({MAX_NODE_DEPTH}) exceeded. "
            "This may indicate a circular connection in your workflow."
        )

    # Check total visits limit
    total_visits = sum(visited_count.values())
    if total_visits >= MAX_NODE_VISITS:
        raise Exception(
            f"Maximum node visits ({MAX_NODE_VISITS}) exceeded. "
            "This may indicate an infinite loop in your workflow."
        )

    # Track this node visit
    visited_count[node_id] = visited_count.get(node_id, 0) + 1

    # Warn if a node is visited too many times (possible loop)
    if visited_count[node_id] > 10:
        executor.log(
            f"Warning: Node {node_id} has been visited {visited_count[node_id]} times. "
            "Check for unintended loops.",
            "warning"
        )

    node = next((n for n in nodes if n["id"] == node_id), None)
    if not node:
        return

    node_type = node.get("type")
    node_data = node.get("data", {})
    result = None

    # Execute the node based on its type
    if node_type == "start":
        executor.log("Workflow started")
    elif node_type == "placeOrder":
        result = executor.execute_place_order(node_data)
    elif node_type == "smartOrder":
        result = executor.execute_smart_order(node_data)
    elif node_type == "optionsOrder":
        result = executor.execute_options_order(node_data)
    elif node_type == "optionsMultiOrder":
        result = executor.execute_options_multi_order(node_data)
    elif node_type == "basketOrder":
        result = executor.execute_basket_order(node_data)
    elif node_type == "splitOrder":
        result = executor.execute_split_order(node_data)
    elif node_type == "modifyOrder":
        result = executor.execute_modify_order(node_data)
    elif node_type == "cancelOrder":
        result = executor.execute_cancel_order(node_data)
    elif node_type == "cancelAllOrders":
        result = executor.execute_cancel_all_orders(node_data)
    elif node_type == "closePositions":
        result = executor.execute_close_positions(node_data)
    elif node_type == "getQuote":
        result = executor.execute_get_quote(node_data)
    elif node_type == "multiQuotes":
        result = executor.execute_multi_quotes(node_data)
    elif node_type == "getDepth":
        result = executor.execute_get_depth(node_data)
    elif node_type == "getOrderStatus":
        result = executor.execute_get_order_status(node_data)
    elif node_type == "openPosition":
        result = executor.execute_open_position(node_data)
    elif node_type == "history":
        result = executor.execute_history(node_data)
    elif node_type == "expiry":
        result = executor.execute_expiry(node_data)
    elif node_type == "symbol":
        result = executor.execute_symbol(node_data)
    elif node_type == "optionSymbol":
        result = executor.execute_option_symbol(node_data)
    elif node_type == "orderBook":
        result = executor.execute_order_book(node_data)
    elif node_type == "tradeBook":
        result = executor.execute_trade_book(node_data)
    elif node_type == "positionBook":
        result = executor.execute_position_book(node_data)
    elif node_type == "syntheticFuture":
        result = executor.execute_synthetic_future(node_data)
    elif node_type == "optionChain":
        result = executor.execute_option_chain(node_data)
    elif node_type == "holidays":
        result = executor.execute_holidays(node_data)
    elif node_type == "timings":
        result = executor.execute_timings(node_data)
    # WebSocket Streaming
    elif node_type == "subscribeLtp":
        result = executor.execute_subscribe_ltp(node_data)
    elif node_type == "subscribeQuote":
        result = executor.execute_subscribe_quote(node_data)
    elif node_type == "subscribeDepth":
        result = executor.execute_subscribe_depth(node_data)
    elif node_type == "unsubscribe":
        result = executor.execute_unsubscribe(node_data)
    # Risk Management
    elif node_type == "holdings":
        result = executor.execute_holdings(node_data)
    elif node_type == "funds":
        result = executor.execute_funds(node_data)
    elif node_type == "margin":
        result = executor.execute_margin(node_data)
    elif node_type == "telegramAlert":
        result = executor.execute_telegram_alert(node_data)
    elif node_type == "httpRequest":
        result = executor.execute_http_request(node_data)
    elif node_type == "delay":
        result = executor.execute_delay(node_data)
    elif node_type == "waitUntil":
        result = executor.execute_wait_until(node_data)
    elif node_type == "log":
        result = executor.execute_log(node_data)
    elif node_type == "variable":
        result = executor.execute_variable(node_data)
    elif node_type == "positionCheck":
        result = executor.execute_position_check(node_data)
    elif node_type == "fundCheck":
        result = executor.execute_fund_check(node_data)
    elif node_type == "priceCondition":
        result = executor.execute_price_condition(node_data)
    elif node_type == "timeWindow":
        result = executor.execute_time_window(node_data)
    elif node_type == "timeCondition":
        result = executor.execute_time_condition(node_data)
    elif node_type == "priceAlert":
        # Price alert trigger - uses quotes API to check price condition
        result = executor.execute_price_alert(node_data)
    elif node_type == "group":
        # Group is just a container, pass through
        pass
    elif node_type == "andGate":
        # AND Gate - collect input condition results
        incoming_edges = incoming_edge_map.get(node_id, [])
        input_results = []
        for edge in incoming_edges:
            source_id = edge.get("source")
            source_result = context.get_condition_result(source_id)
            if source_result is not None:
                input_results.append(source_result)
        result = executor.execute_and_gate(node_data, input_results)
    elif node_type == "orGate":
        # OR Gate - collect input condition results
        incoming_edges = incoming_edge_map.get(node_id, [])
        input_results = []
        for edge in incoming_edges:
            source_id = edge.get("source")
            source_result = context.get_condition_result(source_id)
            if source_result is not None:
                input_results.append(source_result)
        result = executor.execute_or_gate(node_data, input_results)
    elif node_type == "notGate":
        # NOT Gate - invert input condition
        incoming_edges = incoming_edge_map.get(node_id, [])
        input_results = []
        for edge in incoming_edges:
            source_id = edge.get("source")
            source_result = context.get_condition_result(source_id)
            if source_result is not None:
                input_results.append(source_result)
        result = executor.execute_not_gate(node_data, input_results)
    else:
        executor.log(f"Unknown node type: {node_type}", "warning")

    # Broadcast node execution update via WebSocket
    if workflow_id and node_type != "start":
        try:
            node_label = node_data.get("label") or node_type
            status = "info"
            if result:
                status = "success" if result.get("status") == "success" else "error"
            await broadcast_execution_update(
                workflow_id,
                "node_executed",
                f"Executed: {node_label}"
            )
        except Exception as e:
            logger.debug(f"Failed to broadcast node update: {e}")

    # Determine which edges to follow
    edges_to_follow = edge_map.get(node_id, [])

    # For condition nodes, check which path to take (Yes/No)
    if result and "condition" in result:
        condition_met = result.get("condition", False)
        # Store condition result for logic gates to read
        context.set_condition_result(node_id, condition_met)
        filtered_edges = []
        for edge in edges_to_follow:
            source_handle = edge.get("sourceHandle", "")
            if condition_met and source_handle == "yes":
                filtered_edges.append(edge)
            elif not condition_met and source_handle == "no":
                filtered_edges.append(edge)
            elif source_handle not in ["yes", "no"]:
                # Default edges always follow
                filtered_edges.append(edge)
        edges_to_follow = filtered_edges

    # Execute connected nodes
    for edge in edges_to_follow:
        target_id = edge.get("target")
        if target_id:
            await execute_node_chain(
                target_id, nodes, edge_map, incoming_edge_map, executor, context,
                visited_count=visited_count, depth=depth + 1,
                workflow_id=workflow_id
            )


def execute_workflow_sync(workflow_id: int):
    """Synchronous wrapper for execute_workflow (for APScheduler)"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(execute_workflow(workflow_id))
        logger.info(f"Scheduled execution result: {result}")
    finally:
        loop.close()


async def activate_workflow(workflow_id: int, db: AsyncSession) -> dict:
    """Activate a workflow and schedule it"""
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()

    if not workflow:
        return {"status": "error", "message": "Workflow not found"}

    nodes = workflow.nodes or []
    start_node = next((n for n in nodes if n.get("type") == "start"), None)

    if not start_node:
        return {"status": "error", "message": "No start node found"}

    start_data = start_node.get("data", {})
    schedule_type = start_data.get("scheduleType", "daily")
    time_str = start_data.get("time", "09:15")
    days = start_data.get("days", [])
    execute_at = start_data.get("executeAt")

    # Get interval settings (new format)
    interval_value = start_data.get("intervalValue")
    interval_unit = start_data.get("intervalUnit")

    # Backward compatibility: convert old intervalMinutes to new format
    if schedule_type == "interval" and not interval_value:
        interval_minutes = start_data.get("intervalMinutes", 1)
        interval_value = interval_minutes
        interval_unit = "minutes"

    try:
        job_id = workflow_scheduler.add_workflow_job(
            workflow_id=workflow_id,
            schedule_type=schedule_type,
            time_str=time_str,
            days=days,
            execute_at=execute_at,
            interval_value=interval_value,
            interval_unit=interval_unit,
            func=execute_workflow_sync,
        )

        workflow.is_active = True
        workflow.schedule_job_id = job_id
        await db.commit()

        next_run = workflow_scheduler.get_next_run_time(job_id)
        return {
            "status": "success",
            "message": "Workflow activated",
            "job_id": job_id,
            "next_run": next_run.isoformat() if next_run else None,
        }

    except Exception as e:
        logger.error(f"Failed to activate workflow: {e}")
        return {"status": "error", "message": str(e)}


async def deactivate_workflow(workflow_id: int, db: AsyncSession) -> dict:
    """Deactivate a workflow and remove from scheduler"""
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()

    if not workflow:
        return {"status": "error", "message": "Workflow not found"}

    if workflow.schedule_job_id:
        workflow_scheduler.remove_job(workflow.schedule_job_id)

    workflow.is_active = False
    workflow.schedule_job_id = None
    await db.commit()

    return {"status": "success", "message": "Workflow deactivated"}
