from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
import asyncio

from app.core.database import async_session_maker
from app.core.openalgo import OpenAlgoClient
from app.core.scheduler import workflow_scheduler
from app.models.workflow import Workflow, WorkflowExecution
from app.models.settings import AppSettings

logger = logging.getLogger(__name__)


async def get_openalgo_client() -> Optional[OpenAlgoClient]:
    """Get OpenAlgo client from settings"""
    async with async_session_maker() as db:
        result = await db.execute(select(AppSettings).limit(1))
        settings = result.scalar_one_or_none()

        if not settings or not settings.openalgo_api_key:
            return None

        return OpenAlgoClient(
            api_key=settings.openalgo_api_key,
            host=settings.openalgo_host
        )


async def execute_workflow(workflow_id: int) -> dict:
    """Execute a workflow"""
    async with async_session_maker() as db:
        # Get workflow
        result = await db.execute(
            select(Workflow).where(Workflow.id == workflow_id)
        )
        workflow = result.scalar_one_or_none()

        if not workflow:
            return {"status": "error", "message": "Workflow not found"}

        # Create execution record
        execution = WorkflowExecution(
            workflow_id=workflow_id,
            status="running",
            started_at=datetime.utcnow(),
            logs=[]
        )
        db.add(execution)
        await db.commit()
        await db.refresh(execution)

        logs = []

        try:
            # Get OpenAlgo client
            client = await get_openalgo_client()
            if not client:
                raise Exception("OpenAlgo not configured")

            logs.append({
                "time": datetime.utcnow().isoformat(),
                "message": f"Starting workflow: {workflow.name}",
                "level": "info"
            })

            # Process nodes in order (based on edges)
            nodes = workflow.nodes or []
            edges = workflow.edges or []

            # Find start node
            start_node = next((n for n in nodes if n.get("type") == "start"), None)
            if not start_node:
                raise Exception("No start node found")

            # Get connected nodes
            connected_node_ids = [e["target"] for e in edges if e["source"] == start_node["id"]]

            for node_id in connected_node_ids:
                node = next((n for n in nodes if n["id"] == node_id), None)
                if not node:
                    continue

                node_type = node.get("type")
                node_data = node.get("data", {})

                if node_type == "placeOrder":
                    logs.append({
                        "time": datetime.utcnow().isoformat(),
                        "message": f"Executing Place Order: {node_data.get('symbol')} {node_data.get('action')}",
                        "level": "info"
                    })

                    order_result = await client.place_order(
                        symbol=node_data.get("symbol", ""),
                        exchange=node_data.get("exchange", "NSE"),
                        action=node_data.get("action", "BUY"),
                        quantity=node_data.get("quantity", 1),
                        price_type=node_data.get("priceType", "MARKET"),
                        product=node_data.get("product", "MIS"),
                        price=node_data.get("price", 0),
                        trigger_price=node_data.get("triggerPrice", 0)
                    )

                    logs.append({
                        "time": datetime.utcnow().isoformat(),
                        "message": f"Order result: {order_result}",
                        "level": "info" if order_result.get("status") == "success" else "error"
                    })

            # Update execution status
            execution.status = "completed"
            execution.completed_at = datetime.utcnow()
            execution.logs = logs
            await db.commit()

            return {"status": "success", "message": "Workflow executed successfully", "execution_id": execution.id}

        except Exception as e:
            logger.error(f"Workflow execution failed: {e}")
            logs.append({
                "time": datetime.utcnow().isoformat(),
                "message": f"Error: {str(e)}",
                "level": "error"
            })

            execution.status = "failed"
            execution.completed_at = datetime.utcnow()
            execution.error = str(e)
            execution.logs = logs
            await db.commit()

            return {"status": "error", "message": str(e), "execution_id": execution.id}


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
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()

    if not workflow:
        return {"status": "error", "message": "Workflow not found"}

    # Find start node and get schedule config
    nodes = workflow.nodes or []
    start_node = next((n for n in nodes if n.get("type") == "start"), None)

    if not start_node:
        return {"status": "error", "message": "No start node found"}

    start_data = start_node.get("data", {})
    schedule_type = start_data.get("scheduleType", "daily")
    time_str = start_data.get("time", "09:15")
    days = start_data.get("days", [])
    execute_at = start_data.get("executeAt")

    try:
        job_id = workflow_scheduler.add_workflow_job(
            workflow_id=workflow_id,
            schedule_type=schedule_type,
            time_str=time_str,
            days=days,
            execute_at=execute_at,
            func=execute_workflow_sync
        )

        workflow.is_active = True
        workflow.schedule_job_id = job_id
        await db.commit()

        next_run = workflow_scheduler.get_next_run_time(job_id)
        return {
            "status": "success",
            "message": "Workflow activated",
            "job_id": job_id,
            "next_run": next_run.isoformat() if next_run else None
        }

    except Exception as e:
        logger.error(f"Failed to activate workflow: {e}")
        return {"status": "error", "message": str(e)}


async def deactivate_workflow(workflow_id: int, db: AsyncSession) -> dict:
    """Deactivate a workflow and remove from scheduler"""
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()

    if not workflow:
        return {"status": "error", "message": "Workflow not found"}

    if workflow.schedule_job_id:
        workflow_scheduler.remove_job(workflow.schedule_job_id)

    workflow.is_active = False
    workflow.schedule_job_id = None
    await db.commit()

    return {"status": "success", "message": "Workflow deactivated"}
