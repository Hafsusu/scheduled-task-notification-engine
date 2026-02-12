from celery import shared_task
from django.utils import timezone
from django_celery_beat.models import PeriodicTask
import time
import traceback
from .models import ScheduledTask, ExecutionLog, Notification


@shared_task(bind=True, max_retries=3, soft_time_limit=300, time_limit=600)
def execute_scheduled_task(self, task_id):
    start_time = time.time()
    retry_count = self.request.retries
    
    try:
        task = ScheduledTask.objects.get(id=task_id)
        
        if not task.is_active:
            return {"status": "skipped", "reason": "Task is inactive"}
        
        task.last_execution = timezone.now()
        task.total_executions += 1
        task.save()
        
        execution_result = execute_task_logic(task)
        
        execution_time = time.time() - start_time
        
        log = ExecutionLog.objects.create(
            task=task,
            status="SUCCESS",
            message=f"Task executed successfully in {execution_time:.2f}s",
            execution_time=execution_time,
            retry_count=retry_count
        )
        
        Notification.objects.create(
            title=f"✓ Task Executed: {task.name}",
            message=f"Task '{task.name}' completed successfully at {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}.",
            category='TASK_EXECUTED',
            priority='MEDIUM',
            task=task,
            execution_log=log
        )
        
        if task.schedule_type == "ONE_TIME":
            task.executed_once = True
            task.is_active = False
            task.status = 'COMPLETED'
            task.save()
            
            PeriodicTask.objects.filter(name=f"scheduled-task-{task.id}").update(enabled=False)
            
            Notification.objects.create(
                title=f"✓ Task Completed: {task.name}",
                message=f"One-time task '{task.name}' has been completed.",
                category='TASK_COMPLETED',
                priority='LOW',
                task=task
            )
        
        return {
            "status": "success",
            "task_id": task_id,
            "execution_time": execution_time,
            "total_executions": task.total_executions
        }
        
    except ScheduledTask.DoesNotExist:
        return {"status": "failed", "reason": "Task not found"}
        
    except Exception as e:
        execution_time = time.time() - start_time
        
        log = ExecutionLog.objects.create(
            task_id=task_id,
            status="FAILED",
            message=str(e),
            error_details={
                "error": str(e),
                "traceback": traceback.format_exc(),
                "retry_count": retry_count
            },
            execution_time=execution_time,
            retry_count=retry_count
        )
        
        Notification.objects.create(
            title=f"✗ Task Failed: {task.name if 'task' in locals() else 'Unknown'}",
            message=f"Task execution failed: {str(e)}",
            category='TASK_FAILED',
            priority='HIGH',
            task=task if 'task' in locals() else None,
            execution_log=log
        )
        
        try:
            task = ScheduledTask.objects.get(id=task_id)
            if retry_count < task.max_retries:
                countdown = task.retry_delay * (retry_count + 1)
                self.retry(exc=e, countdown=countdown)
        except:
            pass
        
        raise e


@shared_task
def recovery_scan():
    now = timezone.now()
    
    overdue_tasks = ScheduledTask.objects.filter(
        schedule_type="ONE_TIME",
        scheduled_time__lte=now,
        executed_once=False,
        is_active=True,
        status='ACTIVE'
    )
    
    recovered_count = 0
    for task in overdue_tasks:
        execute_scheduled_task.delay(task.id)
        recovered_count += 1
        
        Notification.objects.create(
            title=f"Task Recovery: {task.name}",
            message=f"Task '{task.name}' was missed and has been triggered for recovery.",
            category='RECOVERY',
            priority='HIGH',
            task=task
        )
    
    stuck_tasks = ScheduledTask.objects.filter(
        schedule_type__in=['CRON', 'INTERVAL'],
        is_active=True,
        status='ACTIVE'
    ).exclude(
        next_execution__isnull=False,
        next_execution__gt=now
    )
    
    for task in stuck_tasks:
        from .serializers import ScheduledTaskSerializer
        serializer = ScheduledTaskSerializer()
        serializer._update_periodic_task(task)
    
    return {
        "recovered_tasks": recovered_count,
        "stuck_tasks": stuck_tasks.count()
    }


def execute_task_logic(task):
    import random
    import time
    
    time.sleep(random.uniform(0.5, 2.0))
    
    if random.random() < 0.5:
        raise Exception("Simulated random task failure")
    
    return {"result": "success"}