from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any


class NodeData(BaseModel):
    label: Optional[str] = None
    scheduleType: Optional[str] = None
    time: Optional[str] = None
    days: Optional[list[int]] = None
    executeAt: Optional[str] = None
    symbol: Optional[str] = None
    exchange: Optional[str] = None
    action: Optional[str] = None
    quantity: Optional[int] = None
    priceType: Optional[str] = None
    product: Optional[str] = None
    price: Optional[float] = None
    triggerPrice: Optional[float] = None


class Node(BaseModel):
    id: str
    type: str
    position: dict[str, float]
    data: dict[str, Any]


class Edge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None


class WorkflowCreate(WorkflowBase):
    nodes: list[dict] = []
    edges: list[dict] = []


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[list[dict]] = None
    edges: Optional[list[dict]] = None


class WorkflowResponse(WorkflowBase):
    id: int
    nodes: list[dict]
    edges: list[dict]
    is_active: bool
    schedule_job_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkflowListItem(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_execution_status: Optional[str] = None

    class Config:
        from_attributes = True


class WorkflowExecutionResponse(BaseModel):
    id: int
    workflow_id: int
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    logs: list[dict]
    error: Optional[str]

    class Config:
        from_attributes = True
