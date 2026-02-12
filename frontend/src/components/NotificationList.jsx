import { useEffect, useState } from "react";
import api from "../api";
import {
  Bell,
  CheckCheck,
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Calendar,
  Repeat,
  ChevronRight,
  MailOpen,
  Tag,
  AlertTriangle,
  Info
} from "lucide-react";

export default function NotificationList({ onStatsUpdate }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("UNREAD");
  const [showFilters, setShowFilters] = useState(false);

  const fetchNotifications = async () => {
    try {
      let url = "notifications/?ordering=-created_at";
      if (filter === "UNREAD") {
        url += "&is_read=false";
      }
      const res = await api.get(url);
      setNotifications(res.data);
      
      if (onStatsUpdate) {
        onStatsUpdate({ notifications: res.data.length });
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("notifications/unread_count/");
      setUnreadCount(res.data.unread_count);
      
      if (onStatsUpdate) {
        onStatsUpdate({ unreadCount: res.data.unread_count });
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchNotifications(), fetchUnreadCount()]);
      setLoading(false);
    };
    
    loadData();
    
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [filter]);

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`notifications/${notificationId}/`, { is_read: true });
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("notifications/mark_all_as_read/");
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "CRITICAL": return <AlertCircle className="w-3.5 h-3.5" />;
      case "HIGH": return <AlertTriangle className="w-3.5 h-3.5" />;
      case "MEDIUM": return <Info className="w-3.5 h-3.5" />;
      case "LOW": return <Bell className="w-3.5 h-3.5" />;
      default: return <Bell className="w-3.5 h-3.5" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "HIGH": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "MEDIUM": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "LOW": return "bg-gray-500/20 text-gray-400 border-gray-500/50";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "TASK_EXECUTED": return <CheckCircle className="w-4 h-4" />;
      case "TASK_FAILED": return <XCircle className="w-4 h-4" />;
      case "TASK_COMPLETED": return <CheckCheck className="w-4 h-4" />;
      case "SYSTEM": return <Settings className="w-4 h-4" />;
      case "REMINDER": return <Calendar className="w-4 h-4" />;
      case "RECOVERY": return <Repeat className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "TASK_EXECUTED": return "bg-neonGreen-500/20 text-neonGreen-400";
      case "TASK_FAILED": return "bg-red-500/20 text-red-400";
      case "TASK_COMPLETED": return "bg-blue-500/20 text-blue-400";
      case "SYSTEM": return "bg-purple-500/20 text-purple-400";
      case "REMINDER": return "bg-yellow-500/20 text-yellow-400";
      case "RECOVERY": return "bg-orange-500/20 text-orange-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 overflow-x-hidden transition-all duration-300 hover:border-gray-600 sticky top-6">
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 px-4 sm:px-6 py-5 border-b border-purple-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-3 px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium text-white">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              {unreadCount > 0 && (
                <p className="text-xs sm:text-sm text-purple-200 mt-0.5">
                  You have {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center border border-white/20"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Mark all read</span>
                <span className="sm:hidden">Mark read</span>
              </button>
            )}
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden px-4 py-2 bg-white/10 text-white rounded-xl border border-white/20 flex items-center justify-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              {filter === "ALL" ? "All" : "Unread"}
            </button>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`px-4 py-2 bg-white/10 text-white rounded-xl border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 ${
                showFilters ? 'block' : 'hidden sm:block'
              }`}
            >
              <option value="ALL">All Notifications</option>
              <option value="UNREAD">Unread Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="inline-flex p-4 bg-gray-700/30 rounded-full mb-4">
              <Bell className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Notifications</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              {filter === "UNREAD" 
                ? "You're all caught up! No unread notifications at the moment."
                : "No notifications to display. They will appear here when tasks execute."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {notifications.map((notification) => {
              const PriorityIcon = getPriorityIcon(notification.priority);
              const CategoryIcon = getCategoryIcon(notification.category);
              const isUnread = !notification.is_read;
              
              return (
                <div
                  key={notification.id}
                  className={`group p-4 sm:p-5 hover:bg-gray-700/30 transition-all cursor-pointer ${
                    isUnread ? 'bg-purple-900/10' : ''
                  }`}
                  onClick={() => isUnread && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      getCategoryColor(notification.category)
                    }`}>
                      {CategoryIcon}
                    </div>
                    
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-semibold truncate break-words ${
                            isUnread ? 'text-white' : 'text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          {isUnread && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                              New
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {formatTimeAgo(notification.created_at)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2 break-words whitespace-normal">
                        {notification.message}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 w-full">
                        <span className={`inline-flex items-center max-w-full break-words px-2.5 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                          {PriorityIcon}
                          <span className="ml-1.5">{notification.priority}</span>
                        </span>
                        
                        {notification.task_name && (
                          <span className="inline-flex items-center max-w-full break-words px-2.5 py-1 bg-gray-700/50 rounded-lg text-xs text-gray-300 border border-gray-600/50">
                            <Tag className="w-3 h-3 mr-1.5" />
                            {notification.task_name}
                          </span>
                        )}
                        
                        {!isUnread && (
                          <span className="inline-flex items-center max-w-full break-words px-2.5 py-1 bg-gray-700/30 rounded-lg text-xs text-gray-400">
                            <MailOpen className="w-3 h-3 mr-1.5" />
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {isUnread && (
                      <div className="flex-shrink-0 self-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="bg-gray-900/50 px-4 sm:px-6 py-3 border-t border-gray-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing {notifications.length} {filter === "UNREAD" ? 'unread' : ''} notifications
            </span>
            <button
              onClick={() => setFilter("ALL")}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center"
            >
              View all
              <ChevronRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}