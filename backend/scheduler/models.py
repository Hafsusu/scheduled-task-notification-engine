from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import json


class ScheduledTask(models.Model):
    SCHEDULE_TYPE_CHOICES = [
        ('ONE_TIME', 'One Time'),
        ('CRON', 'Cron Based'),
        ('INTERVAL', 'Interval Based'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('PAUSED', 'Paused'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('PENDING', 'Pending'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, help_text="Detailed description of the task")
    
    schedule_type = models.CharField(max_length=20, choices=SCHEDULE_TYPE_CHOICES, default='ONE_TIME')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    scheduled_time = models.DateTimeField(null=True, blank=True)
    
    cron_minute = models.CharField(max_length=20, default='*', blank=True)
    cron_hour = models.CharField(max_length=20, default='*', blank=True)
    cron_day_of_week = models.CharField(max_length=20, default='*', blank=True)
    cron_day_of_month = models.CharField(max_length=20, default='*', blank=True)
    cron_month_of_year = models.CharField(max_length=20, default='*', blank=True)
    
    interval_seconds = models.IntegerField(null=True, blank=True, 
                                           validators=[MinValueValidator(60)])
    
    is_active = models.BooleanField(default=True)
    
    executed_once = models.BooleanField(default=False)
    total_executions = models.IntegerField(default=0)
    last_execution = models.DateTimeField(null=True, blank=True)
    next_execution = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.CharField(max_length=255, blank=True, null=True)
    
    max_retries = models.IntegerField(default=3)
    retry_delay = models.IntegerField(default=60, help_text="Delay in seconds between retries")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'scheduled_time']),
            models.Index(fields=['schedule_type']),
        ]

    def can_be_modified(self):
        if self.schedule_type == "ONE_TIME":
            return not self.executed_once and timezone.now() < self.scheduled_time
        return self.status in ['ACTIVE', 'PAUSED']

    def can_be_deleted(self):
        return self.status not in ['COMPLETED', 'FAILED'] or \
               (self.schedule_type == "ONE_TIME" and not self.executed_once)

    def __str__(self):
        return f"{self.name} ({self.get_schedule_type_display()})"


class ExecutionLog(models.Model):
    STATUS_CHOICES = [
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('RETRY', 'Retry'),
        ('SKIPPED', 'Skipped'),
        ('TIMEOUT', 'Timeout'),
    ]

    task = models.ForeignKey(ScheduledTask, on_delete=models.CASCADE, related_name='execution_logs')
    executed_at = models.DateTimeField(auto_now_add=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    message = models.TextField(blank=True)
    error_details = models.JSONField(default=dict, blank=True)
    execution_time = models.FloatField(null=True, blank=True, help_text="Execution time in seconds")
    retry_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-executed_at']
        indexes = [
            models.Index(fields=['task', '-executed_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.task.name} - {self.status} @ {self.executed_at}"


class Notification(models.Model):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]

    CATEGORY_CHOICES = [
        ('TASK_EXECUTED', 'Task Executed'),
        ('TASK_FAILED', 'Task Failed'),
        ('TASK_COMPLETED', 'Task Completed'),
        ('SYSTEM', 'System'),
        ('REMINDER', 'Reminder'),
        ('RECOVERY', 'Recovery'),
    ]

    title = models.CharField(max_length=255)
    message = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='TASK_EXECUTED')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    
    task = models.ForeignKey(ScheduledTask, on_delete=models.SET_NULL, null=True, blank=True, 
                            related_name='notifications')
    execution_log = models.ForeignKey(ExecutionLog, on_delete=models.SET_NULL, null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_read', '-created_at']),
            models.Index(fields=['task', '-created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    def mark_as_read(self):
        self.is_read = True
        self.save(update_fields=['is_read'])