from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ScheduledTaskViewSet,
    ExecutionLogViewSet,
    NotificationViewSet
)

router = DefaultRouter()
router.register(r'tasks', ScheduledTaskViewSet, basename='task')
router.register(r'logs', ExecutionLogViewSet, basename='log')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]