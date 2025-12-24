from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class WorkflowScheduler:
    _instance: Optional["WorkflowScheduler"] = None
    _scheduler: Optional[AsyncIOScheduler] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def init(self, db_url: str = "sqlite:///./openalgo_flow.db"):
        if self._scheduler is None:
            jobstores = {
                "default": SQLAlchemyJobStore(url=db_url)
            }
            self._scheduler = AsyncIOScheduler(jobstores=jobstores)
            self._scheduler.start()
            logger.info("Scheduler started")

    @property
    def scheduler(self) -> AsyncIOScheduler:
        if self._scheduler is None:
            raise RuntimeError("Scheduler not initialized. Call init() first.")
        return self._scheduler

    def add_workflow_job(
        self,
        workflow_id: int,
        schedule_type: str,
        time_str: str,
        days: Optional[list[int]] = None,
        execute_at: Optional[str] = None,
        func=None
    ) -> str:
        """Add a workflow job to the scheduler"""
        job_id = f"workflow_{workflow_id}"

        # Remove existing job if any
        self.remove_job(job_id)

        hour, minute = map(int, time_str.split(":"))

        if schedule_type == "once" and execute_at:
            # One-time execution
            execute_datetime = datetime.fromisoformat(execute_at.replace("Z", "+00:00"))
            trigger = DateTrigger(run_date=execute_datetime)
        elif schedule_type == "daily":
            # Daily execution
            trigger = CronTrigger(hour=hour, minute=minute)
        elif schedule_type == "weekly" and days:
            # Weekly execution on specific days
            day_names = {0: "mon", 1: "tue", 2: "wed", 3: "thu", 4: "fri", 5: "sat", 6: "sun"}
            day_of_week = ",".join(day_names[d] for d in days)
            trigger = CronTrigger(day_of_week=day_of_week, hour=hour, minute=minute)
        else:
            raise ValueError(f"Invalid schedule configuration: type={schedule_type}")

        self.scheduler.add_job(
            func,
            trigger=trigger,
            id=job_id,
            args=[workflow_id],
            replace_existing=True
        )

        logger.info(f"Added job {job_id} with trigger {trigger}")
        return job_id

    def remove_job(self, job_id: str) -> bool:
        """Remove a job from the scheduler"""
        try:
            self.scheduler.remove_job(job_id)
            logger.info(f"Removed job {job_id}")
            return True
        except Exception:
            return False

    def get_job(self, job_id: str):
        """Get a job by ID"""
        return self.scheduler.get_job(job_id)

    def get_next_run_time(self, job_id: str) -> Optional[datetime]:
        """Get the next run time for a job"""
        job = self.get_job(job_id)
        if job:
            return job.next_run_time
        return None

    def shutdown(self):
        """Shutdown the scheduler"""
        if self._scheduler:
            self._scheduler.shutdown()
            logger.info("Scheduler shutdown")


# Global scheduler instance
workflow_scheduler = WorkflowScheduler()
