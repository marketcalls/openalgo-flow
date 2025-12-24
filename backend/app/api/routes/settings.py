from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.openalgo import OpenAlgoClient
from app.models.settings import AppSettings
from app.schemas.settings import (
    SettingsUpdate,
    SettingsPublic,
    ConnectionTestResponse
)

router = APIRouter(prefix="/settings", tags=["settings"])


async def get_or_create_settings(db: AsyncSession) -> AppSettings:
    result = await db.execute(select(AppSettings).limit(1))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = AppSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.get("", response_model=SettingsPublic)
async def get_settings(db: AsyncSession = Depends(get_db)):
    """Get current settings (without exposing API key)"""
    settings = await get_or_create_settings(db)
    return SettingsPublic(
        openalgo_host=settings.openalgo_host or "http://127.0.0.1:5000",
        openalgo_ws_url=settings.openalgo_ws_url or "ws://127.0.0.1:8765",
        is_configured=bool(settings.openalgo_api_key),
        has_api_key=bool(settings.openalgo_api_key)
    )


@router.put("")
async def update_settings(
    settings_update: SettingsUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update settings"""
    settings = await get_or_create_settings(db)

    if settings_update.openalgo_api_key is not None:
        settings.openalgo_api_key = settings_update.openalgo_api_key
    if settings_update.openalgo_host:
        settings.openalgo_host = settings_update.openalgo_host
    if settings_update.openalgo_ws_url:
        settings.openalgo_ws_url = settings_update.openalgo_ws_url

    await db.commit()
    await db.refresh(settings)

    return {
        "status": "success",
        "message": "Settings updated successfully"
    }


@router.post("/test", response_model=ConnectionTestResponse)
async def test_connection(db: AsyncSession = Depends(get_db)):
    """Test OpenAlgo connection"""
    settings = await get_or_create_settings(db)

    if not settings.openalgo_api_key:
        return ConnectionTestResponse(
            success=False,
            message="API key not configured"
        )

    client = OpenAlgoClient(
        api_key=settings.openalgo_api_key,
        host=settings.openalgo_host
    )

    result = await client.test_connection()

    if result.get("status") == "success":
        return ConnectionTestResponse(
            success=True,
            message="Connection successful",
            data=result.get("data")
        )
    else:
        return ConnectionTestResponse(
            success=False,
            message=result.get("message", "Connection failed")
        )
