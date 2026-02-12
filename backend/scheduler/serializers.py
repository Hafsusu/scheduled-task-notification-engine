
from rest_framework import serializers
from django_celery_beat.models import (
    ClockedSchedule,
    CrontabSchedule,
    PeriodicTask,
    IntervalSchedule
)
from django.db import transaction
import json
from django.utils import timezone
from .models import ScheduledTask, ExecutionLog, Notification


class ExecutionLogSerializer(serializers.ModelSerializer):
    task_name = serializers.CharField(source='task.name', read_only=True)
    formatted_execution_time = serializers.SerializerMethodField()
    
    class Meta:
        model = ExecutionLog
        fields = [
            'id', 'task', 'task_name', 'executed_at', 'status', 
            'message', 'error_details', 'execution_time', 
            'formatted_execution_time', 'retry_count'
        ]
        read_only_fields = ['executed_at', 'task_name']

    def get_formatted_execution_time(self, obj):
        if obj.execution_time:
            return f"{obj.execution_time:.2f}s"
        return None

class NotificationSerializer(serializers.ModelSerializer):
    task_name = serializers.CharField(source='task.name', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'category', 'priority', 
            'task', 'task_name', 'execution_log', 'is_read', 
            'is_archived', 'created_at', 'expires_at', 'time_ago'
        ]
        read_only_fields = ['created_at', 'time_ago', 'task_name']

    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at) + " ago"


class ScheduledTaskSerializer(serializers.ModelSerializer):
    next_run_time = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    schedule_type_display = serializers.CharField(source='get_schedule_type_display', read_only=True)
    recent_logs = serializers.SerializerMethodField()
    can_be_modified = serializers.BooleanField(read_only=True)
    can_be_deleted = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ScheduledTask
        fields = [
            'id', 'name', 'description', 'schedule_type', 'schedule_type_display',
            'status', 'status_display', 'scheduled_time', 'cron_minute', 'cron_hour',
            'cron_day_of_week', 'cron_day_of_month', 'cron_month_of_year',
            'interval_seconds', 'executed_once', 'total_executions',
            'last_execution', 'next_execution', 'next_run_time', 'created_at',
            'updated_at', 'created_by', 'max_retries', 'retry_delay',
            'can_be_modified', 'can_be_deleted', 'recent_logs'
        ]
        read_only_fields = [
            'executed_once', 'total_executions', 'last_execution', 
            'next_execution', 'created_at', 'updated_at',
            'can_be_modified', 'can_be_deleted'
        ]

    def get_next_run_time(self, obj):
        if obj.schedule_type == 'ONE_TIME':
            return obj.scheduled_time
        elif obj.schedule_type == 'CRON':
            return obj.next_execution
        elif obj.schedule_type == 'INTERVAL' and obj.next_execution:
            return obj.next_execution
        return None

    def get_recent_logs(self, obj):
        logs = obj.execution_logs.all()[:5]
        return ExecutionLogSerializer(logs, many=True).data

    def validate(self, data):
        schedule_type = data.get("schedule_type")

        if schedule_type == "ONE_TIME":
            scheduled_time = data.get("scheduled_time")
            if not scheduled_time:
                raise serializers.ValidationError({
                    "scheduled_time": "Please provide a date and time for this one-time task."
                })
            if scheduled_time <= timezone.now():
                raise serializers.ValidationError({
                    "scheduled_time": "Scheduled time must be in the future."
                })

        elif schedule_type == "CRON":
            cron_fields = {
                "cron_minute": "*",
                "cron_hour": "*",
                "cron_day_of_week": "*",
                "cron_day_of_month": "*",
                "cron_month_of_year": "*"
            }
            
            for field, default in cron_fields.items():
                if field not in data or not data.get(field):
                    data[field] = default

        elif schedule_type == "INTERVAL":
            interval = data.get("interval_seconds")
            if not interval or interval < 60:
                raise serializers.ValidationError({
                    "interval_seconds": "Interval must be at least 60 seconds."
                })

        return data

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['created_by'] = request.user.username
        
        instance = ScheduledTask.objects.create(**validated_data)
        self._create_periodic_task(instance)
        
        Notification.objects.create(
            title=f"Task Created: {instance.name}",
            message=f"Scheduled task '{instance.name}' has been created and scheduled.",
            category='SYSTEM',
            priority='LOW',
            task=instance
        )
        
        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        if not instance.can_be_modified():
            raise serializers.ValidationError({
                "detail": "This task can no longer be edited because it has already executed or is completed."
            })

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        self._update_periodic_task(instance)

        return instance

    def _create_periodic_task(self, instance):
        task_name = f"scheduled-task-{instance.id}"
        
        PeriodicTask.objects.filter(name=task_name).delete()

        if instance.schedule_type == "ONE_TIME":
            schedule = ClockedSchedule.objects.create(
                clocked_time=instance.scheduled_time
            )
            PeriodicTask.objects.create(
                name=task_name,
                task="scheduler.tasks.execute_scheduled_task",
                clocked=schedule,
                one_off=True,
                args=json.dumps([instance.id]),
                enabled=instance.is_active,
                description=f"One-time task: {instance.name}"
            )

        elif instance.schedule_type == "CRON":
            schedule = CrontabSchedule.objects.create(
                minute=instance.cron_minute or '*',
                hour=instance.cron_hour or '*',
                day_of_week=instance.cron_day_of_week or '*',
                day_of_month=instance.cron_day_of_month or '*',
                month_of_year=instance.cron_month_of_year or '*',
            )
            PeriodicTask.objects.create(
                name=task_name,
                task="scheduler.tasks.execute_scheduled_task",
                crontab=schedule,
                args=json.dumps([instance.id]),
                enabled=instance.is_active,
                description=f"Cron task: {instance.name}"
            )

        elif instance.schedule_type == "INTERVAL":
            schedule = IntervalSchedule.objects.create(
                every=instance.interval_seconds,
                period='seconds'
            )
            PeriodicTask.objects.create(
                name=task_name,
                task="scheduler.tasks.execute_scheduled_task",
                interval=schedule,
                args=json.dumps([instance.id]),
                enabled=instance.is_active,
                description=f"Interval task: {instance.name}"
            )

    def _update_periodic_task(self, instance):
        self._create_periodic_task(instance) 