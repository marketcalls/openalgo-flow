from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.openalgo import OpenAlgoClient
from app.models.settings import AppSettings

router = APIRouter(prefix="/symbols", tags=["symbols"])


async def get_openalgo_client(db: AsyncSession = Depends(get_db)) -> OpenAlgoClient:
    result = await db.execute(select(AppSettings).limit(1))
    settings = result.scalar_one_or_none()

    if not settings or not settings.openalgo_api_key:
        raise HTTPException(status_code=400, detail="OpenAlgo not configured")

    return OpenAlgoClient(
        api_key=settings.openalgo_api_key,
        host=settings.openalgo_host
    )


@router.get("/search")
async def search_symbols(
    query: str = Query(..., min_length=1),
    exchange: str = Query(default="NSE"),
    client: OpenAlgoClient = Depends(get_openalgo_client)
):
    """Search for symbols"""
    result = await client.search_symbols(query, exchange)
    return result


@router.get("/quotes")
async def get_quotes(
    symbol: str = Query(...),
    exchange: str = Query(default="NSE"),
    client: OpenAlgoClient = Depends(get_openalgo_client)
):
    """Get quotes for a symbol"""
    result = await client.get_quotes(symbol, exchange)
    return result
