import httpx
from typing import Optional, Any


class OpenAlgoClient:
    def __init__(self, api_key: str, host: str = "http://127.0.0.1:5000"):
        self.api_key = api_key
        self.host = host.rstrip("/")
        self.headers = {
            "Content-Type": "application/json",
        }

    async def _request(self, method: str, endpoint: str, data: Optional[dict] = None) -> dict:
        url = f"{self.host}/api/v1{endpoint}"
        payload = data or {}
        payload["apikey"] = self.api_key

        async with httpx.AsyncClient(timeout=30.0) as client:
            if method == "GET":
                response = await client.get(url, params=payload, headers=self.headers)
            else:
                response = await client.post(url, json=payload, headers=self.headers)

            return response.json()

    async def test_connection(self) -> dict:
        """Test connection by fetching funds"""
        try:
            result = await self._request("POST", "/funds")
            return result
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def place_order(
        self,
        symbol: str,
        exchange: str,
        action: str,
        quantity: int,
        price_type: str = "MARKET",
        product: str = "MIS",
        price: float = 0,
        trigger_price: float = 0,
        strategy: str = "OpenAlgoFlow"
    ) -> dict:
        """Place an order"""
        data = {
            "symbol": symbol,
            "exchange": exchange,
            "action": action,
            "quantity": quantity,
            "pricetype": price_type,
            "product": product,
            "price": price,
            "trigger_price": trigger_price,
            "strategy": strategy
        }
        return await self._request("POST", "/placeorder", data)

    async def place_smart_order(
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
        """Place a smart order"""
        data = {
            "symbol": symbol,
            "exchange": exchange,
            "action": action,
            "quantity": quantity,
            "position_size": position_size,
            "pricetype": price_type,
            "product": product,
            "price": price,
            "trigger_price": trigger_price,
            "strategy": strategy
        }
        return await self._request("POST", "/placesmartorder", data)

    async def cancel_order(self, order_id: str, strategy: str = "OpenAlgoFlow") -> dict:
        """Cancel an order"""
        data = {
            "orderid": order_id,
            "strategy": strategy
        }
        return await self._request("POST", "/cancelorder", data)

    async def cancel_all_orders(self, strategy: str = "OpenAlgoFlow") -> dict:
        """Cancel all orders"""
        data = {"strategy": strategy}
        return await self._request("POST", "/cancelallorder", data)

    async def close_position(self, strategy: str = "OpenAlgoFlow") -> dict:
        """Close all positions"""
        data = {"strategy": strategy}
        return await self._request("POST", "/closeposition", data)

    async def get_order_status(self, order_id: str, strategy: str = "OpenAlgoFlow") -> dict:
        """Get order status"""
        data = {
            "orderid": order_id,
            "strategy": strategy
        }
        return await self._request("POST", "/orderstatus", data)

    async def get_quotes(self, symbol: str, exchange: str) -> dict:
        """Get quotes for a symbol"""
        data = {
            "symbol": symbol,
            "exchange": exchange
        }
        return await self._request("POST", "/quotes", data)

    async def search_symbols(self, query: str, exchange: str) -> dict:
        """Search for symbols"""
        data = {
            "query": query,
            "exchange": exchange
        }
        return await self._request("POST", "/search", data)

    async def get_funds(self) -> dict:
        """Get account funds"""
        return await self._request("POST", "/funds")

    async def get_orderbook(self) -> dict:
        """Get order book"""
        return await self._request("POST", "/orderbook")

    async def get_positions(self) -> dict:
        """Get positions"""
        return await self._request("POST", "/positionbook")

    async def get_holdings(self) -> dict:
        """Get holdings"""
        return await self._request("POST", "/holdings")
