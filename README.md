# OpenAlgo Flow

A visual workflow editor for trading automation with OpenAlgo integration. Build complex trading workflows with a drag-and-drop interface similar to n8n.

## Features

- Visual workflow editor with ReactFlow
- Schedule-based order execution
- OpenAlgo integration for order placement
- Real-time LTP updates via WebSocket
- SQLite database (zero configuration)
- Dark theme optimized for trading

## Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) (auto-installed by setup script)
- OpenAlgo running locally or remotely

## Quick Start

### Windows

1. Run setup (installs uv if needed):
```cmd
setup.bat
```

2. Start the application:
```cmd
start.bat
```

### Linux/Mac

1. Run setup:
```bash
chmod +x setup.sh start.sh
./setup.sh
```

2. Start the application:
```bash
./start.sh
```

## Manual Setup

### Backend (with uv)

```bash
cd backend
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Configuration

1. Open http://localhost:5173
2. Go to Settings
3. Enter your OpenAlgo credentials:
   - **API Key**: Your OpenAlgo API key
   - **Host URL**: OpenAlgo REST API URL (default: http://127.0.0.1:5000)
   - **WebSocket URL**: OpenAlgo WebSocket URL (default: ws://127.0.0.1:8765)
4. Click "Test Connection" to verify
5. Save settings

## Creating Workflows

1. Click "New Workflow" on the Dashboard
2. Drag nodes from the left panel to the canvas:
   - **Schedule**: Set when the workflow runs (once/daily/weekly)
   - **Place Order**: Configure trading orders
3. Connect nodes by dragging from one handle to another
4. Configure each node by clicking on it
5. Save the workflow
6. Click "Activate" to start the schedule

## Node Types

### Triggers

| Node | Description |
|------|-------------|
| Schedule | Start workflow at specified time (once/daily/weekly) |

### Actions

| Node | Description |
|------|-------------|
| Place Order | Place a trading order via OpenAlgo |

## Supported Exchanges

- NSE (Equity)
- NFO (F&O)
- BSE (Equity)
- BFO (F&O)
- CDS (Currency)
- BCD (Currency)
- MCX (Commodity)
- NCDEX (Commodity)
- NSE_INDEX
- BSE_INDEX

## Order Types

| Type | Description |
|------|-------------|
| MARKET | Execute at market price |
| LIMIT | Execute at specified price |
| SL | Stop Loss with limit |
| SL-M | Stop Loss at market |

## Product Types

| Type | Description |
|------|-------------|
| MIS | Intraday (auto square-off) |
| CNC | Cash & Carry (delivery) |
| NRML | Normal (F&O) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/settings | Get settings |
| PUT | /api/settings | Update settings |
| POST | /api/settings/test | Test connection |
| GET | /api/workflows | List workflows |
| POST | /api/workflows | Create workflow |
| GET | /api/workflows/{id} | Get workflow |
| PUT | /api/workflows/{id} | Update workflow |
| DELETE | /api/workflows/{id} | Delete workflow |
| POST | /api/workflows/{id}/activate | Activate |
| POST | /api/workflows/{id}/deactivate | Deactivate |
| POST | /api/workflows/{id}/execute | Run now |

## Tech Stack

- **Frontend**: React, ReactFlow, shadcn/ui, TailwindCSS, Zustand
- **Backend**: FastAPI, SQLAlchemy, APScheduler
- **Database**: SQLite

## Security Notes

- API keys are stored in the local SQLite database
- Run on localhost for development only
- Do not expose to public internet without proper authentication

## License

MIT
