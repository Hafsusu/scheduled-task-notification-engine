
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django_celery_beat.models import PeriodicTask
from django.db import transaction
from .filters import NotificationFilter, ScheduledTaskFilter
from .models import ScheduledTask, ExecutionLog, Notification
from .serializers import (
    ScheduledTaskSerializer,
    ExecutionLogSerializer,
    NotificationSerializer
)

class ScheduledTaskViewSet(viewsets.ModelViewSet):
    queryset = ScheduledTask.objects.all().prefetch_related('execution_logs')
    serializer_class = ScheduledTaskSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    filterset_class = ScheduledTaskFilter
    
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'scheduled_time', 'name', 'total_executions', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        task = self.get_object()
        if task.status == 'ACTIVE':
            task.status = 'PAUSED'
            task.is_active = False
            task.save()
            
            PeriodicTask.objects.filter(name=f"scheduled-task-{task.id}").update(enabled=False)
            
            Notification.objects.create(
                title=f"Task Paused: {task.name}",
                message=f"Scheduled task '{task.name}' has been paused.",
                category='SYSTEM',
                priority='LOW',
                task=task
            )
            
            return Response({'detail': 'Task paused successfully.'})
        return Response({'detail': 'Task cannot be paused.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        task = self.get_object()
        if task.status == 'PAUSED':
            task.status = 'ACTIVE'
            task.is_active = True
            task.save()
            
            PeriodicTask.objects.filter(name=f"scheduled-task-{task.id}").update(enabled=True)
            
            Notification.objects.create(
                title=f"Task Resumed: {task.name}",
                message=f"Scheduled task '{task.name}' has been resumed.",
                category='SYSTEM',
                priority='LOW',
                task=task
            )
            
            return Response({'detail': 'Task resumed successfully.'})
        return Response({'detail': 'Task cannot be resumed.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def execute_now(self, request, pk=None):
        task = self.get_object()
        from .tasks import execute_scheduled_task
        execute_scheduled_task.delay(task.id)
        
        return Response({'detail': 'Task execution triggered.'})

    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        task = self.get_object()
        logs = task.execution_logs.all()[:50]
        serializer = ExecutionLogSerializer(logs, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if not instance.can_be_deleted():
            return Response(
                {"detail": "This task cannot be deleted because it has already completed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            PeriodicTask.objects.filter(name=f"scheduled-task-{instance.id}").delete()
            
            Notification.objects.create(
                title=f"Task Deleted: {instance.name}",
                message=f"Scheduled task '{instance.name}' has been deleted.",
                category='SYSTEM',
                priority='LOW'
            )
            
            instance.delete()

        return Response(
            {"detail": "Task deleted successfully."},
            status=status.HTTP_200_OK
        )

class ExecutionLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExecutionLog.objects.all().select_related('task')
    serializer_class = ExecutionLogSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['task', 'status']
    search_fields = ['task__name', 'message']
    ordering_fields = ['-executed_at']
    ordering = ['-executed_at']

class NotificationViewSet(viewsets.ModelViewSet):
    
    queryset = Notification.objects.all().select_related('task')
    serializer_class = NotificationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    filterset_class = NotificationFilter

    
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'priority', 'is_read']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        instance = self.get_object()
        instance.is_read = True
        instance.save(update_fields=['is_read'])
        return Response({"detail": "Notification marked as read."})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"detail": f"{updated} notifications marked as read."})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"unread_count": count})

    @action(detail=False, methods=['post'])
    def archive_all_read(self, request):
        updated = self.get_queryset().filter(is_read=True, is_archived=False).update(is_archived=True)
        return Response({"detail": f"{updated} notifications archived."})

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        is_read = request.data.get('is_read', True)
        instance.is_read = is_read
        instance.save(update_fields=['is_read'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)