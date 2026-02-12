import { useEffect, useState } from "react";
import api from "../api";
import TaskDetailModal from "./TaskDetailModal";
import { 
  CalendarClock,
  Repeat,
  Timer,
  Calendar,
  Search,
  Filter,
  Eye,
  Pause,
  Play,
  Zap,
  Trash2,
  Edit,
  Loader2,
  CheckCircle,
  Clock,
  Hash,
  XCircle,
  Activity
} from "lucide-react";

export default function TaskList({ refreshTrigger }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = "tasks/";
      if (filter !== "ALL") {
        url += `?status=${filter}`;
      }
      const res = await api.get(url);
      setTasks(res.data);
      
      if (onStatsUpdate) {
        onStatsUpdate();
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filter, refreshTrigger]);

  const handleDelete = async (taskId, taskName) => {
    if (!window.confirm(`Are you sure you want to delete "${taskName}"?`)) {
      return;
    }

    try {
      await api.delete(`tasks/${taskId}/`);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete task");
    }
  };

  const handlePauseResume = async (taskId, action) => {
    try {
      await api.post(`tasks/${taskId}/${action}/`);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.detail || `Failed to ${action} task`);
    }
  };

  const handleExecuteNow = async (taskId) => {
    try {
      await api.post(`tasks/${taskId}/execute_now/`);
      alert("Task execution triggered!");
    } catch (err) {
      alert("Failed to trigger task execution");
    }
  };

  const getStatusBadge = (task) => {
    const statusConfig = {
      ACTIVE: { 
        color: "bg-neonGreen-500/20 text-neonGreen-400 border-neonGreen-500/50",
        icon: Activity
      },
      PAUSED: { 
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
        icon: Pause
      },
      COMPLETED: { 
        color: "bg-blue-500/20 text-blue-400 border-blue-500/50",
        icon: CheckCircle
      },
      FAILED: { 
        color: "bg-red-500/20 text-red-400 border-red-500/50",
        icon: XCircle
      },
      PENDING: { 
        color: "bg-gray-500/20 text-gray-400 border-gray-500/50",
        icon: Clock
      },
    };

    const config = statusConfig[task.status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {task.status_display || task.status}
      </span>
    );
  };

  const getScheduleIcon = (type) => {
    switch (type) {
      case "ONE_TIME": return <CalendarClock className="w-5 h-5 text-blue-400" />;
      case "CRON": return <Repeat className="w-5 h-5 text-purple-400" />;
      case "INTERVAL": return <Timer className="w-5 h-5 text-orange-400" />;
      default: return <Calendar className="w-5 h-5 text-gray-400" />;
    }
  };

  const canEdit = (task) => {
    return task.can_be_modified === true;
  };

  const filteredTasks = tasks.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden transition-all duration-300 hover:border-gray-600">
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-4 sm:px-6 py-5 border-b border-gray-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-neonGreen-500/10 rounded-lg">
              <CalendarClock className="w-6 h-6 text-neonGreen-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                Scheduled Tasks
                <span className="ml-3 px-2.5 py-1 bg-gray-700/80 rounded-lg text-sm font-normal text-gray-300">
                  {tasks.length}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Manage and monitor your scheduled tasks
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 pl-10 bg-gray-900/50 text-white rounded-xl border border-gray-700/70 focus:border-neonGreen-500 focus:ring-2 focus:ring-neonGreen-500/30 outline-none transition-all placeholder-gray-500 text-sm"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden px-4 py-2 bg-gray-900/50 text-white rounded-xl border border-gray-700/70 flex items-center justify-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`px-4 py-2 bg-gray-900/50 text-white rounded-xl border border-gray-700/70 focus:border-neonGreen-500 focus:ring-2 focus:ring-neonGreen-500/30 outline-none transition-all text-sm ${
                showFilters ? 'block' : 'hidden sm:block'
              }`}
            >
              <option value="ALL">All Tasks</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-12 h-12 text-neonGreen-500 animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex p-4 bg-gray-700/30 rounded-full mb-4">
              <CalendarClock className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Tasks Found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {searchTerm 
                ? "No tasks match your search criteria. Try adjusting your filters."
                : "Create your first scheduled task to get started with automation."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="group bg-gray-900/30 hover:bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-neonGreen-500/50 transition-all duration-300"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 p-2 rounded-lg ${
                          task.status === 'FAILED' ? 'bg-red-500/10 animate-pulse' :
                          task.status === 'ACTIVE' ? 'bg-neonGreen-500/10' :
                          'bg-gray-700/30'
                        }`}>
                          {getScheduleIcon(task.schedule_type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white truncate">
                              {task.name}
                            </h3>
                            {getStatusBadge(task)}
                          </div>
                          
                          {task.description && (
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center">
                              <Calendar className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
                              <span className="text-gray-500">Schedule:</span>
                              <span className="ml-1.5 text-gray-300 font-medium">
                                {task.schedule_type_display}
                              </span>
                            </div>
                            
                            {task.schedule_type === "ONE_TIME" && task.scheduled_time && (
                              <div className="flex items-center">
                                <Clock className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
                                <span className="text-gray-500">Scheduled:</span>
                                <span className="ml-1.5 text-gray-300">
                                  {new Date(task.scheduled_time).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <Hash className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
                              <span className="text-gray-500">Executions:</span>
                              <span className="ml-1.5 text-gray-300 font-medium">
                                {task.total_executions || 0}
                              </span>
                            </div>
                            
                            {task.next_run_time && (
                              <div className="flex items-center">
                                <Timer className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
                                <span className="text-gray-500">Next:</span>
                                <span className="ml-1.5 text-neonGreen-400 font-medium">
                                  {new Date(task.next_run_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:min-w-[120px]">
                      <div className="flex flex-col w-full gap-2">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="flex-1 lg:flex-none px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium transition-all flex items-center justify-center border border-blue-500/20 hover:border-blue-500/40"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">View</span>
                          <span className="sm:hidden">View</span>
                        </button>
                        
                        {canEdit(task) && (
                          <button
                            onClick={() => setSelectedTask({ ...task, isEditing: true })}
                            className="flex-1 lg:flex-none px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl text-sm font-medium transition-all flex items-center justify-center border border-purple-500/20 hover:border-purple-500/40"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Edit</span>
                            <span className="sm:hidden">Edit</span>
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-col w-full gap-2">
                        {task.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handlePauseResume(task.id, 'pause')}
                            className="flex-1 lg:flex-none px-4 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-xl text-sm font-medium transition-all flex items-center justify-center border border-yellow-500/20 hover:border-yellow-500/40"
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Pause</span>
                            <span className="sm:hidden">Pause</span>
                          </button>
                        ) : task.status === 'PAUSED' ? (
                          <button
                            onClick={() => handlePauseResume(task.id, 'resume')}
                            className="flex-1 lg:flex-none px-4 py-2.5 bg-neonGreen-500/10 hover:bg-neonGreen-500/20 text-neonGreen-400 rounded-xl text-sm font-medium transition-all flex items-center justify-center border border-neonGreen-500/20 hover:border-neonGreen-500/40"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Resume</span>
                            <span className="sm:hidden">Resume</span>
                          </button>
                        ) : null}
                        
                        {canEdit(task) && task.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleExecuteNow(task.id)}
                            className="flex-1 lg:flex-none px-4 py-2.5 bg-gray-600/10 hover:bg-gray-600/20 text-gray-300 rounded-xl text-sm font-medium transition-all flex items-center justify-center border border-gray-600/20 hover:border-gray-600/40"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Run Now</span>
                            <span className="sm:hidden">Run</span>
                          </button>
                        )}
                        
                        {task.can_be_deleted && (
                          <button
                            onClick={() => handleDelete(task.id, task.name)}
                            className="flex-1 lg:flex-none px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-all flex items-center justify-center border border-red-500/20 hover:border-red-500/40"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Delete</span>
                            <span className="sm:hidden">Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdate={() => {
            fetchTasks();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}