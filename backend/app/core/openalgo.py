"""
OpenAlgo SDK Wrapper
Uses official openalgo Python library v1.0.45+
"""
from openalgo import api
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class OpenAlgoClient:
    """Wrapper around the official OpenAlgo Python SDK"""

    def __init__(self, api_key: str, host: str = "http://127.0.0.1:5000"):
        self.api_key = api_key
        self.host = host.rstrip("/")
        self.client = api(api_key=api_key, host=host)

    def place_order(
        self,
        symbol: str,
        exchange: str,
        action: str,
        quantity: int,
        price_type: str = "MARKET",
        product: str = "MIS",
        price: float = 0,
        trigger_price: float = 0,
        disclosed_quantity: int = 0,
        strategy: str = "OpenAlgoFlow"
    ) -> dict:
        """Place an order using SDK"""
        return self.client.placeorder(
            strategy=strategy,
            symbol=symbol,
            exchange=exchange,
            action=action,
            quantity=quantity,
            price_type=price_type,
            product=product,
            price=price,
            trigger_price=trigger_price,
            disclosed_quantity=disclosed_quantity
        )

    def place_smart_order(
        self,
        symbol: str,
        exchange: str,
        action: str,
        quantity: int,
        position_size: int,
        price_type: str = "MARKET",
        product: str = "MIS",
        price: float = 0,
        trigger_price: float = 0,
        strategy: str = "OpenAlgoFlow"
    ) -> dict:
        """Place a smart order using SDK"""
        return self.client.placesmartorder(
            strategy=strategy,
            symbol=symbol,
            exchange=exchange,
            action=action,
            quantity=quantity,
            position_size=position_size,
            price_type=price_type,
            product=product,
            price=price,
            trigger_price=trigger_price
        )

    def options_order(
        self,
        underlying: str,
        exchange: str,
        expiry_date: str,
        offset: str,
        option_type: str,
        action: str,
        quantity: int,
        price_type: str = "MARKET",
        product: str = "NRML",
        splitsize: int = 0,
        strategy: str = "OpenAlgoFlow"
    ) -> dict:
        """Place an options order using SDK"""
        return self.client.optionsorder(
            strategy=strategy,
            underlying=underlying,
            exchange=exchange,
            expiry_date=expiry_date,
            offset=offset,
            option_type=option_type,
            action=action,
            quantity=quantity,
            pricetype=price_type,
            product=product,
            splitsize=splitsize
        )

    def options_multi_order(
        self,
        underlying: str,
        exchange: str,
        legs: List[Dict[str, Any]],
        strategy: str = "OpenAlgoFlow"
    ) -> dict:
        """Place multi-leg options order using SDK

        Each leg should contain: offset, option_type, action, quantity, expiry_date,
        and optionally: product, pricetype, splitsize
        """
        return self.client.optionsmultiorder(
            strategy=strategy,
            underlying=underlying,
            exchange=exchange,
            legs=legs,
        )

    def basket_order(
        self,
        orders: List[Dict[str, Any]],
        strategy: str = "OpenAlgoFlow"
    ) -> dict:
        """Place basket order using SDK"""
        return self.client.basketorder(orders=orders)

    def split_order(
        self,
        symbol: str,
        exchange: str,
        action: str,
        quantity: int,
        splitsize: int,
        price_type: str = "MARKET",
        product: str = "MIS",
        price: float = 0,
        trigger_price: float = 0,
        strategy: str = "OpenAlgoFlow"
    ) -> dict:
        """Place split order using SDK"""
        return self.client.splitorder(
            symbol=symbol,
            exchange=exchange,
            action=action,
            quantity=quantity,
            splitsize=splitsize,
            price_type=price_type,
            product=product,
            price=price,
            trigger_price=trigger_price
        )

    def modify_order(
        self,
        order_id: str,
        symbol: str,
        exchange: str,
        action: str,
        quantity: int,
        price_type: str = "LIMIT",
        product: str = "MIS",
        price: float = 0,
        trigger_price: float = 0,
        strategy: str = "OpenAlgoFlow"
    ) -> dict:
        """Modify an existing order using SDK"""
        return self.client.modifyorder(
            order_id=order_id,
            strategy=strategy,
            symbol=symbol,
            exchange=exchange,
            action=action,
            quantity=quantity,
            price_type=price_type,
            product=product,
            price=price,
            trigger_price=trigger_price
        )

    def cancel_order(self, order_id: str, strategy: str = "OpenAlgoFlow") -> dict:
        """Cancel an order using SDK"""
        return self.client.cancelorder(order_id=order_id, strategy=strategy)

    def cancel_all_orders(self, strategy: str = "OpenAlgoFlow") -> dict:
        """Cancel all orders using SDK"""
        return self.client.cancelallorder(strategy=strategy)

    def close_position(self, strategy: str = "OpenAlgoFlow") -> dict:
        """Close all positions using SDK"""
        return self.client.closeposition(strategy=strategy)

    def get_order_status(self, order_id: str, strategy: str = "OpenAlgoFlow") -> dict:
        """Get order status using SDK"""
        return self.client.orderstatus(order_id=order_id, strategy=strategy)

    def get_open_position(
        self,
        symbol: str,
        exchange: str,
        product: str = "MIS",
        strategy: str = "OpenAlgoFlow"
    ) -> dict:
        """Get open position for a symbol using SDK"""
        return self.client.openposition(
            strategy=strategy,
            symbol=symbol,
            exchange=exchange,
            product=product
        )

    def get_quotes(self, symbol: str, exchange: str) -> dict:
        """Get quotes for a symbol using SDK"""
        return self.client.quotes(symbol=symbol, exchange=exchange)

    def get_multi_quotes(self, symbols: List[Dict[str, str]]) -> dict:
        """Get quotes for multiple symbols using SDK"""
        return self.client.multiquotes(symbols=symbols)

    def get_depth(self, symbol: str, exchange: str) -> dict:
        """Get market depth using SDK"""
        return self.client.depth(symbol=symbol, exchange=exchange)

    def get_history(
        self,
        symbol: str,
        exchange: str,
        interval: str,
        start_date: str,
        end_date: str
    ) -> Any:
        """Get historical data using SDK"""
        return self.client.history(
            symbol=symbol,
            exchange=exchange,
            interval=interval,
            start_date=start_date,
            end_date=end_date
        )

    def get_expiry(
        self,
        symbol: str,
        exchange: str,
        instrumenttype: str = "options"
    ) -> dict:
        """Get expiry dates using SDK"""
        return self.client.expiry(
            symbol=symbol,
            exchange=exchange,
            instrumenttype=instrumenttype
        )

    def get_option_chain(
        self,
        underlying: str,
        exchange: str,
        expiry_date: str,
        strike_count: Optional[int] = None
    ) -> dict:
        """Get option chain using SDK"""
        kwargs = {
            "underlying": underlying,
            "exchange": exchange,
            "expiry_date": expiry_date
        }
        if strike_count:
            kwargs["strike_count"] = strike_count
        return self.client.optionchain(**kwargs)

    def get_option_greeks(
        self,
        symbol: str,
        exchange: str,
        underlying_symbol: str,
        underlying_exchange: str,
        interest_rate: float = 0.0
    ) -> dict:
        """Get option greeks using SDK"""
        return self.client.optiongreeks(
            symbol=symbol,
            exchange=exchange,
            underlying_symbol=underlying_symbol,
            underlying_exchange=underlying_exchange,
            interest_rate=interest_rate
        )

    def search_symbols(self, query: str, exchange: str) -> dict:
        """Search for symbols using SDK"""
        return self.client.search(query=query, exchange=exchange)

    def get_funds(self) -> dict:
        """Get account funds using SDK"""
        return self.client.funds()

    def get_orderbook(self) -> dict:
        """Get order book using SDK"""
        return self.client.orderbook()

    def get_tradebook(self) -> dict:
        """Get trade book using SDK"""
        return self.client.tradebook()

    def get_positions(self) -> dict:
        """Get positions using SDK"""
        return self.client.positionbook()

    def get_holdings(self) -> dict:
        """Get holdings using SDK"""
        return self.client.holdings()

    def send_telegram(self, username: str, message: str) -> dict:
        """Send Telegram notification using SDK"""
        return self.client.telegram(username=username, message=message)

    def test_connection(self) -> dict:
        """Test connection by fetching funds"""
        try:
            result = self.get_funds()
            return result
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_holidays(self, year: int) -> dict:
        """Get market holidays using SDK"""
        return self.client.holidays(year=year)

    def get_timings(self, date: str) -> dict:
        """Get market timings using SDK"""
        return self.client.timings(date=date)

    def get_analyzer_status(self) -> dict:
        """Get analyzer mode status using SDK"""
        return self.client.analyzerstatus()

    def toggle_analyzer(self, mode: bool) -> dict:
        """Toggle analyzer mode using SDK"""
        return self.client.analyzertoggle(mode=mode)
