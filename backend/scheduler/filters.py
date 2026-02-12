
import django_filters
from .models import Notification, ScheduledTask

class ScheduledTaskFilter(django_filters.FilterSet):
    
    schedule_type = django_filters.ChoiceFilter(choices=ScheduledTask.SCHEDULE_TYPE_CHOICES)
    status = django_filters.ChoiceFilter(choices=ScheduledTask.STATUS_CHOICES)
    is_active = django_filters.BooleanFilter()
    executed_once = django_filters.BooleanFilter()
    
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    scheduled_after = django_filters.DateTimeFilter(field_name='scheduled_time', lookup_expr='gte')
    scheduled_before = django_filters.DateTimeFilter(field_name='scheduled_time', lookup_expr='lte')
    
    class Meta:
        model = ScheduledTask
        fields = ['schedule_type', 'status', 'is_active', 'executed_once']
        
class NotificationFilter(django_filters.FilterSet):
    is_read = django_filters.BooleanFilter()
    is_archived = django_filters.BooleanFilter()
    category = django_filters.ChoiceFilter(choices=Notification.CATEGORY_CHOICES)
    priority = django_filters.ChoiceFilter(choices=Notification.PRIORITY_CHOICES)
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    task_id = django_filters.NumberFilter(field_name='task__id')
    
    class Meta:
        model = Notification
        fields = ['is_read', 'is_archived', 'category', 'priority', 'task']