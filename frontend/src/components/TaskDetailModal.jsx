import { useState, useEffect } from "react";
import api from "../api";
import { 
  CalendarClock,
  Repeat,
  Timer,
  Calendar,
  Clock,
  Hash,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  Pause,
  Edit,
  Save,
  X,
  Loader2,
  ChevronRight,
  Settings,
  History,
  Info,
  RefreshCw
} from "lucide-react";

export default function TaskDetailModal({ task, onClose, onTaskUpdate }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(task.isEditing || false);
  const [editFormData, setEditFormData] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab, task.id]);

  useEffect(() => {
    if (isEditing) {
      setEditFormData({
        name: task.name,
        description: task.description || "",
        schedule_type: task.schedule_type,
        scheduled_time: task.scheduled_time ? task.scheduled_time.slice(0, 16) : "",
        cron_minute: task.cron_minute || "*",
        cron_hour: task.cron_hour || "*",
        cron_day_of_week: task.cron_day_of_week || "*",
        cron_day_of_month: task.cron_day_of_month || "*",
        cron_month_of_year: task.cron_month_of_year || "*",
        interval_seconds: task.interval_seconds || 3600,
        max_retries: task.max_retries,
        retry_delay: task.retry_delay,
      });
    }
  }, [isEditing, task]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`tasks/${task.id}/logs/`);
      setLogs(res.data.logs || res.data || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    if (editErrors[name]) {
      setEditErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateEditForm = () => {
    const errors = {};

    if (!editFormData.name?.trim()) {
      errors.name = "Task name is required";
    }

    if (editFormData.schedule_type === "ONE_TIME") {
      if (!editFormData.scheduled_time) {
        errors.scheduled_time = "Scheduled time is required";
      } else {
        const selectedTime = new Date(editFormData.scheduled_time);
        if (selectedTime <= new Date()) {
          errors.scheduled_time = "Scheduled time must be in the future";
        }
      }
    }

    if (editFormData.schedule_type === "INTERVAL") {
      const interval = parseInt(editFormData.interval_seconds);
      if (!interval || interval < 60) {
        errors.interval_seconds = "Interval must be at least 60 seconds";
      }
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validateEditForm()) return;

    setIsSaving(true);
    try {
      const submitData = {
        name: editFormData.name,
        description: editFormData.description,
        schedule_type: editFormData.schedule_type,
        max_retries: parseInt(editFormData.max_retries),
        retry_delay: parseInt(editFormData.retry_delay),
      };

      if (editFormData.schedule_type === "ONE_TIME") {
        const scheduledDate = new Date(editFormData.scheduled_time);
        submitData.scheduled_time = scheduledDate.toISOString();
      } else if (editFormData.schedule_type === "CRON") {
        submitData.cron_minute = editFormData.cron_minute || '*';
        submitData.cron_hour = editFormData.cron_hour || '*';
        submitData.cron_day_of_week = editFormData.cron_day_of_week || '*';
        submitData.cron_day_of_month = editFormData.cron_day_of_month || '*';
        submitData.cron_month_of_year = editFormData.cron_month_of_year || '*';
      } else if (editFormData.schedule_type === "INTERVAL") {
        submitData.interval_seconds = parseInt(editFormData.interval_seconds);
      }

      await api.put(`tasks/${task.id}/`, submitData);
      onTaskUpdate();
    } catch (err) {
      console.error("Failed to update task:", err);
      setEditErrors({ form: err.response?.data?.detail || "Failed to update task" });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ACTIVE": return <Activity className="w-4 h-4" />;
      case "PAUSED": return <Pause className="w-4 h-4" />;
      case "COMPLETED": return <CheckCircle className="w-4 h-4" />;
      case "FAILED": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getLogStatusColor = (status) => {
    switch (status) {
      case "SUCCESS": return "text-neonGreen-400 bg-neonGreen-500/10 border-neonGreen-500/20";
      case "FAILED": return "text-red-400 bg-red-500/10 border-red-500/20";
      case "RETRY": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getLogStatusIcon = (status) => {
    switch (status) {
      case "SUCCESS": return <CheckCircle className="w-3.5 h-3.5 mr-1" />;
      case "FAILED": return <XCircle className="w-3.5 h-3.5 mr-1" />;
      case "RETRY": return <RefreshCw className="w-3.5 h-3.5 mr-1" />;
      default: return <Clock className="w-3.5 h-3.5 mr-1" />;
    }
  };

  const getScheduleIcon = (type) => {
    switch (type) {
      case "ONE_TIME": return <CalendarClock className="w-5 h-5 text-blue-400" />;
      case "CRON": return <Repeat className="w-5 h-5 text-purple-400" />;
      case "INTERVAL": return <Timer className="w-5 h-5 text-orange-400" />;
      default: return <Calendar className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"></div>

      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="relative w-full max-w-5xl transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gray-800/95 rounded-2xl shadow-2xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
            
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-6 py-5 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-neonGreen-500/10 rounded-lg">
                    {getScheduleIcon(task.schedule_type)}
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center flex-wrap gap-2">
                      {isEditing ? 'Edit Task' : task.name}
                      {!isEditing && (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          task.status === 'ACTIVE' ? 'bg-neonGreen-500/20 text-neonGreen-400 border-neonGreen-500/50' :
                          task.status === 'PAUSED' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                          task.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' :
                          'bg-red-500/20 text-red-400 border-red-500/50'
                        }`}>
                          {getStatusIcon(task.status)}
                          <span className="ml-1.5">{task.status_display}</span>
                        </span>
                      )}
                    </h3>
                    {!isEditing && (
                      <p className="text-sm text-gray-400 mt-1 flex items-center">
                        <Hash className="w-3.5 h-3.5 mr-1" />
                        Task ID: {task.id}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border-b border-gray-700/50 px-6 overflow-x-auto">
              <nav className="flex space-x-6 min-w-max">
                {[
                  { id: "details", label: "Details", icon: Info },
                  { id: "logs", label: "Execution History", icon: History },
                  { id: "settings", label: "Settings", icon: Settings },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-3 px-1 border-b-2 font-medium text-sm transition-all flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? "border-neonGreen-500 text-neonGreen-400"
                          : "border-transparent text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="px-6 py-6 max-h-[50vh] overflow-y-auto">
              {activeTab === "details" && (
                <div className="space-y-6">
                  {isEditing ? (
                    <div className="space-y-5">
                      {editErrors.form && (
                        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-red-300 text-sm">{editErrors.form}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-300">
                          <Tag className="w-4 h-4 mr-2 text-neonGreen-400" />
                          Task Name <span className="text-red-400 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editFormData?.name || ''}
                          onChange={handleEditChange}
                          className={`w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg border ${
                            editErrors.name ? "border-red-500/70" : "border-gray-700"
                          } focus:border-neonGreen-500 focus:ring-2 focus:ring-neonGreen-500/30 outline-none transition-all`}
                        />
                        {editErrors.name && (
                          <p className="text-sm text-red-400 flex items-center mt-1">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {editErrors.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-300">
                          <FileText className="w-4 h-4 mr-2 text-neonGreen-400" />
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={editFormData?.description || ''}
                          onChange={handleEditChange}
                          rows="3"
                          className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-neonGreen-500 focus:ring-2 focus:ring-neonGreen-500/30 outline-none transition-all resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-300">
                          <Calendar className="w-4 h-4 mr-2 text-neonGreen-400" />
                          Schedule Type
                        </label>
                        <div className="px-4 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 flex items-center">
                          {getScheduleIcon(task.schedule_type)}
                          <span className="ml-2">{task.schedule_type_display}</span>
                          <span className="ml-2 text-xs text-gray-500">(Cannot be changed)</span>
                        </div>
                      </div>

                      <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                          {getScheduleIcon(editFormData?.schedule_type)}
                          <span className="ml-2">Schedule Configuration</span>
                        </h4>

                        {editFormData?.schedule_type === "ONE_TIME" && (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">
                              Execution Date & Time <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="datetime-local"
                              name="scheduled_time"
                              value={editFormData?.scheduled_time || ''}
                              onChange={handleEditChange}
                              className={`w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg border ${
                                editErrors.scheduled_time ? "border-red-500/70" : "border-gray-700"
                              } focus:border-neonGreen-500 focus:ring-2 focus:ring-neonGreen-500/30 outline-none transition-all`}
                            />
                            {editErrors.scheduled_time && (
                              <p className="text-sm text-red-400 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {editErrors.scheduled_time}
                              </p>
                            )}
                          </div>
                        )}

                        {editFormData?.schedule_type === "CRON" && (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {[
                              { name: "cron_minute", label: "Minute", placeholder: "*", desc: "0-59, *" },
                              { name: "cron_hour", label: "Hour", placeholder: "*", desc: "0-23, *" },
                              { name: "cron_day_of_month", label: "Day", placeholder: "*", desc: "1-31, *" },
                              { name: "cron_month_of_year", label: "Month", placeholder: "*", desc: "1-12, *" },
                              { name: "cron_day_of_week", label: "Week Day", placeholder: "*", desc: "0-6, MON" },
                            ].map((field) => (
                              <div key={field.name} className="space-y-1">
                                <label className="block text-xs text-gray-400">{field.label}</label>
                                <input
                                  type="text"
                                  name={field.name}
                                  value={editFormData?.[field.name] || '*'}
                                  onChange={handleEditChange}
                                  placeholder={field.placeholder}
                                  className="w-full px-2 py-1.5 bg-gray-900 text-white rounded border border-gray-700 focus:border-neonGreen-500 focus:ring-1 focus:ring-neonGreen-500 outline-none text-center text-sm"
                                />
                                <span className="text-xs text-gray-500 block">{field.desc}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {editFormData?.schedule_type === "INTERVAL" && (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">
                              Interval (seconds) <span className="text-red-400">*</span>
                            </label>
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                name="interval_seconds"
                                value={editFormData?.interval_seconds || 3600}
                                onChange={handleEditChange}
                                min="60"
                                step="60"
                                className={`w-full max-w-xs px-4 py-2.5 bg-gray-900 text-white rounded-lg border ${
                                  editErrors.interval_seconds ? "border-red-500/70" : "border-gray-700"
                                } focus:border-neonGreen-500 focus:ring-2 focus:ring-neonGreen-500/30 outline-none transition-all`}
                              />
                              <span className="text-sm text-gray-400">
                                ({Math.floor(editFormData?.interval_seconds / 60)} minutes)
                              </span>
                            </div>
                            {editErrors.interval_seconds && (
                              <p className="text-sm text-red-400 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {editErrors.interval_seconds}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                          <Settings className="w-4 h-4 mr-2 text-neonGreen-400" />
                          Advanced Settings
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">
                              Max Retries
                            </label>
                            <input
                              type="number"
                              name="max_retries"
                              value={editFormData?.max_retries || 3}
                              onChange={handleEditChange}
                              min="0"
                              max="10"
                              className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-neonGreen-500 focus:ring-2 focus:ring-neonGreen-500/30 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">
                              Retry Delay (seconds)
                            </label>
                            <input
                              type="number"
                              name="retry_delay"
                              value={editFormData?.retry_delay || 60}
                              onChange={handleEditChange}
                              min="10"
                              className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-neonGreen-500 focus:ring-2 focus:ring-neonGreen-500/30 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50">
                          <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            Schedule Type
                          </h4>
                          <p className="text-white font-medium flex items-center">
                            {getScheduleIcon(task.schedule_type)}
                            <span className="ml-2">{task.schedule_type_display}</span>
                          </p>
                        </div>
                        
                        <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50">
                          <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                            Created At
                          </h4>
                          <p className="text-white">
                            {new Date(task.created_at).toLocaleDateString()} at{' '}
                            {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50">
                          <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                            <Activity className="w-3.5 h-3.5 mr-1.5" />
                            Last Execution
                          </h4>
                          <p className="text-white">
                            {task.last_execution 
                              ? `${new Date(task.last_execution).toLocaleDateString()} at ${new Date(task.last_execution).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : 'Never'}
                          </p>
                        </div>

                        <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50">
                          <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                            <Hash className="w-3.5 h-3.5 mr-1.5" />
                            Total Executions
                          </h4>
                          <p className="text-white text-2xl font-bold">{task.total_executions || 0}</p>
                        </div>

                        <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50">
                          <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                            Max Retries
                          </h4>
                          <p className="text-white">{task.max_retries}</p>
                        </div>

                        <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50">
                          <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                            <Timer className="w-3.5 h-3.5 mr-1.5" />
                            Retry Delay
                          </h4>
                          <p className="text-white">{task.retry_delay} seconds</p>
                        </div>
                      </div>

                      {task.description && (
                        <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50">
                          <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                            <FileText className="w-3.5 h-3.5 mr-1.5" />
                            Description
                          </h4>
                          <p className="text-white bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                            {task.description}
                          </p>
                        </div>
                      )}

                      <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50">
                        <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                          {getScheduleIcon(task.schedule_type)}
                          <span className="ml-1.5">Schedule Configuration</span>
                        </h4>
                        <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/30">
                          {task.schedule_type === "ONE_TIME" && (
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 text-gray-500 mr-2" />
                              <span className="text-white font-medium">
                                {new Date(task.scheduled_time).toLocaleString()}
                              </span>
                            </div>
                          )}
                          
                          {task.schedule_type === "CRON" && (
                            <div className="flex items-center">
                              <Repeat className="w-4 h-4 text-gray-500 mr-2" />
                              <code className="text-neonGreen-400 bg-gray-900 px-3 py-1.5 rounded-lg font-mono">
                                {task.cron_minute} {task.cron_hour} {task.cron_day_of_month} {task.cron_month_of_year} {task.cron_day_of_week}
                              </code>
                            </div>
                          )}
                          
                          {task.schedule_type === "INTERVAL" && (
                            <div className="flex items-center">
                              <Timer className="w-4 h-4 text-gray-500 mr-2" />
                              <span className="text-white">
                                Every {task.interval_seconds} seconds ({Math.floor(task.interval_seconds / 60)} minutes)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "logs" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium text-white flex items-center">
                      <History className="w-5 h-5 mr-2 text-neonGreen-400" />
                      Execution History
                    </h4>
                    <button
                      onClick={fetchLogs}
                      className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-all flex items-center border border-gray-600/50"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </button>
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 text-neonGreen-500 animate-spin" />
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-700/50">
                      <div className="inline-flex p-3 bg-gray-800 rounded-full mb-3">
                        <History className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-gray-400">No execution logs yet</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Logs will appear here when the task executes
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {logs.map((log) => (
                        <div key={log.id} className="bg-gray-900/30 p-4 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getLogStatusColor(log.status)}`}>
                                {getLogStatusIcon(log.status)}
                                {log.status}
                              </span>
                              <span className="text-sm text-gray-400 flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                {new Date(log.executed_at).toLocaleString()}
                              </span>
                            </div>
                            {log.execution_time && (
                              <span className="text-xs text-gray-500 flex items-center">
                                <Timer className="w-3 h-3 mr-1" />
                                {log.formatted_execution_time || `${log.execution_time.toFixed(2)}s`}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-300">{log.message}</p>
                          {log.error_details && Object.keys(log.error_details).length > 0 && (
                            <details className="mt-3">
                              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 flex items-center">
                                <ChevronRight className="w-3 h-3 mr-1" />
                                Error Details
                              </summary>
                              <pre className="mt-2 p-3 bg-gray-950 rounded-lg text-xs text-red-400 overflow-x-auto border border-red-500/20">
                                {JSON.stringify(log.error_details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-neonGreen-400" />
                    Task Settings
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-900/30 rounded-lg p-5 border border-gray-700/50">
                      <h5 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Configuration
                      </h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-700/30">
                          <span className="text-gray-300">Max Retries</span>
                          <span className="text-white font-semibold bg-gray-800 px-3 py-1 rounded-lg">
                            {task.max_retries}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Retry Delay</span>
                          <span className="text-white font-semibold bg-gray-800 px-3 py-1 rounded-lg">
                            {task.retry_delay} seconds
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-900/30 rounded-lg p-5 border border-gray-700/50">
                      <h5 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                        <Info className="w-4 h-4 mr-2" />
                        Task Information
                      </h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-700/30">
                          <span className="text-gray-300">Task ID</span>
                          <span className="text-neonGreen-400 font-mono text-sm bg-gray-800 px-3 py-1 rounded-lg">
                            #{task.id}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Created</span>
                          <span className="text-white">
                            {new Date(task.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-900/50 px-6 py-4 border-t border-gray-700/50 ">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg font-medium transition-all flex items-center border border-gray-600/50"
                >
                  <X className="w-4 h-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Close'}
                </button>

                {isEditing ? (
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-neonGreen-600 to-neonGreen-500 hover:from-neonGreen-500 hover:to-neonGreen-400 text-white rounded-lg font-semibold flex items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                ) : (
                  task.can_be_modified && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg font-medium transition-all flex items-center border border-purple-500/30"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Task
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}