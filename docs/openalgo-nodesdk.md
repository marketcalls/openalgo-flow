# NodeJS

To install the OpenAlgo Node.js library, use npm:

```bash
npm install openalgo
```

## OpenAlgo Node.js Library Documentation

### Get the OpenAlgo API Key

Make sure that your OpenAlgo Application is running. Login to the OpenAlgo Application with valid credentials and get the OpenAlgo API key.

\
For detailed function parameters, refer to the [API Documentation](https://docs.openalgo.in/api-documentation/v1).

### Getting Started with OpenAlgo

First, import the OpenAlgo class from the library and initialize it with your API key:

```javascript
import OpenAlgo from 'openalgo';

// Replace 'YOUR_API_KEY' with your actual API key
// Specify the host URL with your hosted domain or ngrok domain.
// If running locally in Windows then use the default host value.
const openalgo = new OpenAlgo('YOUR_API_KEY', 'http://127.0.0.1:5000');
```

### Check OpenAlgo Version

```javascript
import { version } from 'openalgo';
console.log(version);
```

### PlaceOrder Example

To place a new order:

```javascript
const response = await openalgo.placeOrder({
    strategy: "NodeJS",
    symbol: "NHPC", 
    action: "BUY",
    exchange: "NSE",
    pricetype: "MARKET",
    product: "MIS",
    quantity: 1
});
console.log(response);
```

**Place Market Order Response**

```json
{ orderid: '251014001118706', status: 'success' }

```

### PlaceSmartOrder Example

To place a smart order considering the current position size:

```javascript
const response = await openalgo.placeSmartOrder({
    strategy: "NodeJS",
    symbol: "TATAMOTORS",
    action: "SELL",
    exchange: "NSE",
    pricetype: "MARKET",
    product: "MIS",
    quantity: 1,
    positionSize: 5
});
console.log(response);
```

**Place Smart Market Order Response**

```json
{ orderid: '251014001220562', status: 'success' }
```

### BasketOrder Example

To place a new basket order:

```javascript
const basketOrders = [
    {
        symbol: "BHEL",
        exchange: "NSE",
        action: "BUY",
        quantity: 1,
        pricetype: "MARKET",
        product: "MIS"
    },
    {
        symbol: "ZOMATO",
        exchange: "NSE",
        action: "SELL",
        quantity: 1,
        pricetype: "MARKET",
        product: "MIS"
    }
];

const response = await openalgo.basketOrder({
    strategy: "NodeJS",
    orders: basketOrders
});
console.log(response);
```

**Basket Order Response**

```json
orders: [
    {
      "symbol": "BHEL",
      "exchange": "NSE",
      "action": "BUY",
      "quantity": "1",
      "pricetype": "MARKET",
      "product": "MIS"
    },
    {
      "symbol": "ZOMATO",
      "exchange": "NSE",
      "action": "SELL",
      "quantity": "1",
      "pricetype": "MARKET",
      "product": "MIS"
    }
  ]
}
{
  results: [
    { orderid: '251014001197781', status: 'success', symbol: 'BHEL' },
    {
      orderid: '251014001197784',
      status: 'success',
      symbol: 'ZOMATO'
    }
  ],
  status: 'success'
}

```

### SplitOrder Example

To place a new split order:

```javascript
const response = await openalgo.splitOrder({
    symbol: "YESBANK",
    exchange: "NSE",
    action: "SELL",
    quantity: 105,
    splitSize: 20,
    pricetype: "MARKET",
    product: "MIS",
    strategy: "NodeJS"
});
console.log(response);
```

**SplitOrder Response**

```json
{
  results: [
    {
      order_num: 1,
      orderid: '251014001203073',
      quantity: 20,
      status: 'success'
    },
    {
      order_num: 2,
      orderid: '251014001203066',
      quantity: 20,
      status: 'success'
    }
    {
      order_num: 3,
      orderid: '251014001203020',
      quantity: 20,
      status: 'success'
    },
    {
      order_num: 4,
      orderid: '251014001203038',
      quantity: 20,
      status: 'success'
    },
    {
      order_num: 5,
      orderid: '251014001203053',
      quantity: 20,
      status: 'success'
    },
    {
      order_num: 6,
      orderid: '251014001203071',
      quantity: 5,
      status: 'success'
    },
  ],
  split_size: 20,
  status: 'success',
  total_quantity: 105
}

```

### ModifyOrder Example

To modify an existing order:

```javascript
const response = await openalgo.modifyOrder({
    orderId: "251014001145296",
    strategy: "NodeJS",
    symbol: "YESBANK",
    action: "BUY",
    exchange: "NSE",
    pricetype: "LIMIT",
    product: "CNC",
    quantity: 2,
    price: 22.5
});
console.log(response);
```

**Modify Order Response**

```json
{ orderid: '251014001145296', status: 'success' }
```

### CancelOrder Example

To cancel an existing order:

```javascript
const response = await openalgo.cancelOrder({
    orderId: "251014001145296",
    strategy: "NodeJS"
});
console.log(response);
```

**Cancelorder Response**

```json
{ orderid: '251014001145296', status: 'success' }
```

### CancelAllOrder Example

To cancel all open orders and trigger pending orders:

```javascript
const response = await openalgo.cancelAllOrder({
    strategy: "NodeJS"
});
console.log(response);
```

**Cancelallorder Response**

```json
{
  canceled_orders: [ '251014001145296' ],
  failed_cancellations: [],
  message: 'Canceled 1 orders. Failed to cancel 0 orders.',
  status: 'success'
}
```

### ClosePosition Example

To close all open positions across various exchanges:

```javascript
const response = await openalgo.closePosition({
    strategy: "NodeJS"
});
console.log(response);
```

**ClosePosition Response**

```json
{ message: 'All Open Positions Squared Off', status: 'success' }
```

### OrderStatus Example

To get the current order status:

```javascript
const response = await openalgo.orderStatus({
    orderId: "251014000831724",
    strategy: "NodeJS"
});
console.log(response);
```

**Orderstatus Response**

```json
{
  data: {
    action: 'SELL',
    average_price: 0,
    exchange: 'NFO',
    order_status: 'rejected',
    orderid: '251014000831724',
    price: 0,
    pricetype: 'MARKET',
    product: 'MIS',
    quantity: '75',
    symbol: 'NIFTY20OCT2525100PE',
    timestamp: '14-Oct-2025 12:15:20',
    trigger_price: 0
  },
  status: 'success'
}
```

### OpenPosition Example

To get the current open position:

```javascript
const response = await openalgo.openPosition({
    strategy: "NodeJS",
    symbol: "YESBANK",
    exchange: "NSE",
    product: "MIS"
});
console.log(response);
```

**OpenPosition Response**

```json
{ quantity: '1', status: 'success' }
```

### Quotes Example

To get real-time quotes:

```javascript
const response = await openalgo.quotes({
    symbol: "RELIANCE", 
    exchange: "NSE"
});
console.log(response);
```

**Quotes response**

```json
{
  data: {
    ask: 1374.6,
    bid: 1374.5,
    high: 1388,
    low: 1370.1,
    ltp: 1374.6,
    oi: 231402500,
    open: 1380,
    prev_close: 1375,
    volume: 6130583
  },
  status: 'success'
}
```

### Depth Example

To get market depth data:

```javascript
const response = await openalgo.depth({
    symbol: "SBIN", 
    exchange: "NSE"
});
console.log(response);
```

**Depth Response**

```json
{
  "status": "success",
  "data": {
    "asks": [
      {"price": 870.65, "quantity": 120},
      {"price": 870.7, "quantity": 111},
      {"price": 870.75, "quantity": 105},
      {"price": 870.8, "quantity": 69},
      {"price": 870.85, "quantity": 244}
    ],
    "bids": [
      {"price": 870.35, "quantity": 36},
      {"price": 870.3, "quantity": 70},
      {"price": 870.2, "quantity": 345},
      {"price": 870.15, "quantity": 575},
      {"price": 870.1, "quantity": 611}
    ],
    "high": 880.4,
    "low": 869.1,
    "ltp": 870.35,
    "ltq": 1,
    "oi": 0,
    "open": 875.2,
    "prev_close": 870.5,
    "totalbuyqty": 1637,
    "totalsellqty": 649,
    "volume": 313325
  }
}
```

### History Example

To get historical data:

```javascript
const response = await openalgo.history({
    symbol: "SBIN",
    exchange: "NSE",
    interval: "5m",
    startDate: "2025-04-01",
    endDate: "2025-04-08"
});
console.log(response);
```

**History Response**

```json
[
  {
    close: 872.85,
    high: 875.55,
    low: 871,
    oi: 0,
    open: 872.3,
    timestamp: 1759290300,
    volume: 219571
  },
  {
    close: 874.85,
    high: 876.45,
    low: 872.1,
    oi: 0,
    open: 872.85,
    timestamp: 1759290600,
    volume: 154111
  },
  {
    close: 871.1,
    high: 875.5,
    low: 870.3,
    oi: 0,
    open: 874.85,
    timestamp: 1759290900,
    volume: 131664
  },
  {
    close: 870.85,
    high: 871.9,
    low: 870.65,
    oi: 0,
    open: 871.1,
    timestamp: 1759291200,
    volume: 69056
  },
  {
    close: 873.15,
    high: 873.3,
    low: 870.8,
    oi: 0,
    open: 871.1,
    timestamp: 1759291500,
    volume: 85892
  },
]
```

### Intervals Example

To get supported time intervals:

```javascript
const response = await openalgo.intervals();
console.log(response);
```

**Intervals response**

```json
{
  data: {
    days: [ 'D' ],
    hours: [ '1h' ],
    minutes: [ '1m', '3m', '5m', '10m', '15m', '30m' ],
    months: [],
    seconds: [],
    weeks: []
  },
  status: 'success'
}
```

### Symbol Example

To get symbol information:

```javascript
const response = await openalgo.symbol({
    symbol: "RELIANCE",
    exchange: "NSE"
});
console.log(response);
```

**Symbols Response**

```json
{
  data: {
    brexchange: 'NSE',
    brsymbol: 'RELIANCE-EQ',
    exchange: 'NSE',
    expiry: '',
    id: 3645,
    instrumenttype: '',
    lotsize: 1,
    name: 'RELIANCE',
    strike: -0.01,
    symbol: 'RELIANCE',
    tick_size: 0.1,
    token: '2885'
  },
  status: 'success'
}
```

### **Search Example**

```python
const response = await client.search({
            query: 'NIFTY 25000 OCT CE',
            exchange: 'NFO'
        });
console.log(response);
```

**Search Response**

```json
{
  data: [
    {
      brexchange: 'NFO',
      brsymbol: 'FINNIFTY28OCT2525000CE',
      exchange: 'NFO',
      expiry: '28-OCT-25',
      instrumenttype: 'OPTIDX',
      lotsize: 65,
      name: 'FINNIFTY',
      strike: 25000,
      symbol: 'FINNIFTY28OCT2525000CE',
      tick_size: 0.05,
      token: '57065'
    },
    {
      brexchange: 'NFO',
      brsymbol: 'NIFTY28OCT2525000CE',
      exchange: 'NFO',
      expiry: '28-OCT-25',
      instrumenttype: 'OPTIDX',
      lotsize: 75,
      name: 'NIFTY',
      strike: 25000,
      symbol: 'NIFTY28OCT2525000CE',
      tick_size: 0.05,
      token: '58909'
    },
    {
      brexchange: 'NFO',
      brsymbol: 'NIFTY20OCT2525000CE',
      exchange: 'NFO',
      expiry: '20-OCT-25',
      instrumenttype: 'OPTIDX',
      lotsize: 75,
      name: 'NIFTY',
      strike: 25000,
      symbol: 'NIFTY20OCT2525000CE',
      tick_size: 0.05,
      token: '45248'
    }
  ],
  message: 'Found 3 matching symbols',
  status: 'success'
}
```

### **Expiry Example**

```python
const response = await client.expiry({
            symbol: 'NIFTY',
            exchange: 'NFO',
            instrumenttype: 'options'
        });
console.log(response);
```

**Expiry Response**

```json
{
  data: [
    '20-OCT-25', '28-OCT-25',
    '04-NOV-25', '11-NOV-25',
    '18-NOV-25', '25-NOV-25',
    '30-DEC-25', '31-MAR-26',
    '30-JUN-26', '29-SEP-26',
    '29-DEC-26', '29-JUN-27',
    '28-DEC-27', '27-JUN-28',
    '26-DEC-28', '26-JUN-29',
    '24-DEC-29', '25-JUN-30'
  ],
  message: 'Found 18 expiry dates for NIFTY options in NFO',
  status: 'success'
}
```

### Funds Example

To get account funds information:

```javascript
const response = await openalgo.funds();
console.log(response);
```

**Funds Response**

```json
{
  data: {
    availablecash: '182.02',
    collateral: '0.00',
    m2mrealized: '0.00',
    m2munrealized: '0.00',
    utiliseddebits: '0.00'
  },
  status: 'success'
}
```

### OrderBook Example

To get the order book:

```javascript
const response = await openalgo.orderbook();
console.log(response);
```

**OrderBook Response**

```json
{
  "data": {
    "orders": [
      {
        "action": "BUY",
        "exchange": "NFO",
        "order_status": "rejected",
        "orderid": "251014000831729",
        "price": 0,
        "pricetype": "MARKET",
        "product": "MIS",
        "quantity": "75",
        "symbol": "NIFTY14OCT2525100PE",
        "timestamp": "14-Oct-2025 12:15:20",
        "trigger_price": 0
      },
      {
        "action": "BUY",
        "exchange": "NFO",
        "order_status": "rejected",
        "orderid": "251014000831731",
        "price": 0,
        "pricetype": "MARKET",
        "product": "MIS",
        "quantity": "75",
        "symbol": "NIFTY14OCT2525100CE",
        "timestamp": "14-Oct-2025 12:15:20",
        "trigger_price": 0
      },
      {
        "action": "SELL",
        "exchange": "NFO",
        "order_status": "rejected",
        "orderid": "251014000831736",
        "price": 0,
        "pricetype": "MARKET",
        "product": "MIS",
        "quantity": "75",
        "symbol": "NIFTY20OCT2525100CE",
        "timestamp": "14-Oct-2025 12:15:20",
        "trigger_price": 0
      }
    ],
    "statistics": {
      "total_buy_orders": 5,
      "total_completed_orders": 1,
      "total_open_orders": 1,
      "total_rejected_orders": 5,
      "total_sell_orders": 2
    }
  },
  "status": "success"
}
```

### TradeBook Example

To get the trade book:

```javascript
const response = await openalgo.tradebook();
console.log(response);
```

**TradeBook Response**

```json
{
  "data": [
    {
      "action": "BUY",
      "average_price": 23.28,
      "exchange": "NSE",
      "orderid": "251014001118706",
      "product": "MIS",
      "quantity": 0,
      "symbol": "YESBANK",
      "timestamp": "13:52:56",
      "trade_value": 23.28
    }
  ],
  "status": "success"
}
```

### PositionBook Example

To get the position book:

```javascript
const response = await openalgo.positionbook();
console.log(response);
```

**PositionBook Response**

```json
{
  "data": [
    {
      "average_price": "23.28",
      "exchange": "NSE",
      "ltp": "23.29",
      "pnl": "0.01",
      "product": "MIS",
      "quantity": "1",
      "symbol": "YESBANK"
    }
  ],
  "status": "success"
}
```

### Holdings Example

To get holdings:

```javascript
const response = await openalgo.holdings();
console.log(response);
```

**Holdings Response**

```json
{
        "exchange": "NSE",
        "pnl": 28,
        "pnlpercent": 3.85,
        "product": "CNC",
        "quantity": 3,
        "symbol": "WIPRO"
      },
      {
        "exchange": "NSE",
        "pnl": 23,
        "pnlpercent": 15.62,
        "product": "CNC",
        "quantity": 1,
        "symbol": "TATASTEEL"
      }
    ],
    "statistics": {
      "totalholdingvalue": 3244,
      "totalinvvalue": 3107,
      "totalpnlpercentage": 4.4,
      "totalprofitandloss": 136.83
    }
  },
  "status": "success"
}
```

### **Analyzer Status Example**

```python
const response = await client.analyzerstatus();
console.log(response);
```

**Analyzer Status Response**

```json
{
  data: { analyze_mode: true, mode: 'analyze', total_logs: 64 },
  status: 'success'
}
```

### **Analyzer Toggle Example**

```python
const response = await client.analyzertoggle({ mode: false });
console.log(response);
```

**Analyzer Toggle Response**

```json
{
  data: {
    analyze_mode: true,
    message: 'Analyzer mode switched to analyze',
    mode: 'analyze',
    total_logs: 64
  },
  status: 'success'
}
{
  data: {
    analyze_mode: false,
    message: 'Analyzer mode switched to live',
    mode: 'live',
    total_logs: 64
  },
  status: 'success'
}
```

### **LTP Data (Streaming Websocket)**

```python
// Simple WebSocket LTP Test - Runs for 1 minute
import OpenAlgo from 'openalgo';

// Initialize OpenAlgo client
const client = new OpenAlgo(
    'your-openalgo-api-key',  // Replace with your actual OpenAlgo API key
    'http://127.0.0.1:5000',      // REST API host
    'v1',                          // API version
    'ws://127.0.0.1:8765'         // WebSocket host
);

// Define instruments to subscribe for LTP
const instruments = [
    { exchange: "NSE", symbol: "RELIANCE" },
    { exchange: "NSE", symbol: "INFY" }
];

// Callback function for LTP updates
function onLTP(data) {
    console.log("LTP Update Received:");
    console.log(data);
}

async function runLTPTest() {
    try {
        // Connect and subscribe
        await client.connect();
        client.subscribe_ltp(instruments, onLTP);

        // Run for 10 seconds to receive data
        console.log('Listening for 10 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));

    } finally {
        // Unsubscribe and disconnect
        client.unsubscribe_ltp(instruments);
        client.disconnect();
        console.log('\n Test completed - Disconnected');
    }
}

runLTPTest();

```

### **Quotes (Streaming Websocket)**

```python
// Simple WebSocket LTP Test - Runs for 1 minute

import OpenAlgo from 'openalgo';

// Initialize OpenAlgo client
const client = new OpenAlgo(
    'your-openalgo-api-key',  // Replace with your actual OpenAlgo API key
    'http://127.0.0.1:5000',      // REST API host
    'v1',                          // API version
    'ws://127.0.0.1:8765'         // WebSocket host
);

// Define instruments to subscribe for LTP
const instruments = [
    { exchange: "NSE", symbol: "RELIANCE" },
    { exchange: "NSE", symbol: "INFY" }
];

// Callback function for LTP updates
function onLTP(data) {
    console.log("LTP Update Received:");
    console.log(data);
}

async function runLTPTest() {
    try {
        // Connect and subscribe
        await client.connect();
        client.subscribe_ltp(instruments, onLTP);

        // Run for 10 seconds to receive data
        console.log('Listening for 10 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));

    } finally {
        // Unsubscribe and disconnect
        client.unsubscribe_ltp(instruments);
        client.disconnect();
        console.log('\n Test completed - Disconnected');
    }
}

runLTPTest();

```

### **Depth (Streaming Websocket)**

```javascript
// Simple WebSocket Market Depth Test - Runs for 10 seconds

import OpenAlgo from 'openalgo';

// Initialize OpenAlgo client
const client = new OpenAlgo(
    'your-openalgo-api-key',  // Replace with your actual OpenAlgo API key
    'http://127.0.0.1:5000',      // REST API host
    'v1',                          // API version
    'ws://127.0.0.1:8765'         // WebSocket host
);

// Define instruments to subscribe for Market Depth
const instruments = [
    { exchange: "NSE", symbol: "HDFCBANK" }
];

// Callback function for Market Depth updates
function onDepth(data) {
    console.log("Market Depth Update Received:");
    console.log(data);
}

async function runDepthTest() {
    try {
        // Connect and subscribe
        await client.connect();
        client.subscribe_depth(instruments, onDepth);

        // Run for 10 seconds to receive data
        console.log('Listening for 10 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));

    } finally {
        // Unsubscribe and disconnect
        client.unsubscribe_depth(instruments);
        client.disconnect();
        console.log('\n Test completed - Disconnected');
    }
}

runDepthTest();

```

```python
```

Please refer to the documentation and consult the API reference for details on optional parameters:

* [API Documentation](https://docs.openalgo.in/api-documentation/v1)
* [Order Constants](https://docs.openalgo.in/api-documentation/v1/order-constants)