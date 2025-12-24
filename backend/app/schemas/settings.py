from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SettingsBase(BaseModel):
    openalgo_api_key: Optional[str] = None
    openalgo_host: str = "http://127.0.0.1:5000"
    openalgo_ws_url: str = "ws://127.0.0.1:8765"


class SettingsCreate(SettingsBase):
    pass


class SettingsUpdate(SettingsBase):
    pass


class SettingsResponse(SettingsBase):
    id: int
    created_at: datetime
    updated_at: datetime
    is_configured: bool = False

    class Config:
        from_attributes = True


class SettingsPublic(BaseModel):
    openalgo_host: str
    openalgo_ws_url: str
    is_configured: bool
    has_api_key: bool


class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
