import { useState, useEffect } from "react";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import NotificationList from "../components/NotificationList";
import api from "../api";
import {
  CalendarClock,
  CheckCircle,
  Clock,
  Bell,
  Activity,
  TrendingUp,
  AlertCircle,
  Loader2
} from "lucide-react";

export default function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    failedTasks: 0,
    activeTasks: 0,
    pausedTasks: 0,
    totalNotifications: 0,
    unreadNotifications: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const tasksRes = await api.get("tasks/");
      const tasks = tasksRes.data;
      
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === "COMPLETED").length;
      const failedTasks = tasks.filter(t => t.status === "FAILED").length;
      const activeTasks = tasks.filter(t => t.status === "ACTIVE").length;
      const pausedTasks = tasks.filter(t => t.status === "PAUSED").length;
      const pendingTasks = activeTasks + pausedTasks;
      
      const notificationsRes = await api.get("notifications/?limit=1");
      const unreadRes = await api.get("notifications/unread_count/");
      
      setStats({
        totalTasks,
        completedTasks,
        failedTasks,
        activeTasks,
        pausedTasks,
        pendingTasks,
        totalNotifications: notificationsRes.data.count || notificationsRes.data.length || 0,
        unreadNotifications: unreadRes.data.unread_count || 0
      });
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const handleTaskCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchStats();
  };

  const handleStatsUpdate = (notificationStats) => {
    setStats(prev => ({
      ...prev,
      ...notificationStats
    }));
  };

  const statsCards = [
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: CalendarClock,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/20"
    },
    {
      title: "Active",
      value: stats.activeTasks,
      icon: Activity,
      color: "from-neonGreen-500 to-neonGreen-600",
      bgColor: "bg-neonGreen-500/10",
      iconColor: "text-neonGreen-400",
      borderColor: "border-neonGreen-500/20"
    },
    {
      title: "Completed",
      value: stats.completedTasks,
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-400",
      borderColor: "border-green-500/20"
    },
    {
      title: "Failed",
      value: stats.failedTasks,
      icon: AlertCircle,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-500/10",
      iconColor: "text-red-400",
      borderColor: "border-red-500/20"
    },
    {
      title: "Notifications",
      value: stats.totalNotifications,
      subtitle: `${stats.unreadNotifications} unread`,
      icon: Bell,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-400",
      borderColor: "border-purple-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                Task <span className="text-neonGreen-400 bg-neonGreen-500/10 px-3 py-1 rounded-xl">Scheduler</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-400 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-neonGreen-400" />
                Schedule, manage, and monitor automated tasks and notifications
              </p>
            </div>
            
            <div className="flex items-center text-xs sm:text-sm text-gray-500 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-4 sm:p-5 animate-pulse">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-700 rounded-xl mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-16 mb-2"></div>
                    <div className="h-6 bg-gray-700 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {statsCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className="group bg-gray-800/50 backdrop-blur-sm hover:bg-gray-800/70 rounded-2xl border border-gray-700/50 hover:border-gray-600/50 p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-2.5 sm:p-3 ${card.bgColor} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.iconColor}`} />
                    </div>
                    {card.subtitle && (
                      <span className="text-xs px-2 py-1 bg-gray-700/50 rounded-full text-gray-400">
                        {card.subtitle}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">{card.title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white">
                      {card.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <TaskForm onTaskCreated={handleTaskCreated} />
            <TaskList 
              refreshTrigger={refreshTrigger} 
              onStatsUpdate={fetchStats}
            />
          </div>
          
          <div className="lg:col-span-1">
            <NotificationList onStatsUpdate={handleStatsUpdate} />
          </div>
        </div>
      </div>
    </div>
  );
}