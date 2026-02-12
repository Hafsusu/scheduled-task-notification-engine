import { useState } from "react";
import api from "../api";
import { 
  Clock, 
  Calendar, 
  Repeat, 
  Timer, 
  AlertCircle, 
  CheckCircle, 
  Settings, 
  ChevronDown,
  Plus,
  RotateCcw,
  Loader2,
  CalendarClock,
  Hash,
  Tag,
  FileText,
  ChevronRight
} from "lucide-react";

export default function TaskForm({ onTaskCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    schedule_type: "ONE_TIME",
    scheduled_time: "",
    cron_minute: "*",
    cron_hour: "*",
    cron_day_of_week: "*",
    cron_day_of_month: "*",
    cron_month_of_year: "*",
    interval_seconds: 3600,
    max_retries: 3,
    retry_delay: 60,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Task name is required";
    }

    if (formData.schedule_type === "ONE_TIME") {
      if (!formData.scheduled_time) {
        newErrors.scheduled_time = "Scheduled time is required";
      } else {
        const selectedTime = new Date(formData.scheduled_time);
        if (selectedTime <= new Date()) {
          newErrors.scheduled_time = "Scheduled time must be in the future";
        }
      }
    }

    if (formData.schedule_type === "INTERVAL") {
      const interval = parseInt(formData.interval_seconds);
      if (!interval || interval < 60) {
        newErrors.interval_seconds = "Interval must be at least 60 seconds";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSuccess("");

    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        schedule_type: formData.schedule_type,
        max_retries: parseInt(formData.max_retries),
        retry_delay: parseInt(formData.retry_delay),
      };

      if (formData.schedule_type === "ONE_TIME") {
        const scheduledDate = new Date(formData.scheduled_time);
        submitData.scheduled_time = scheduledDate.toISOString();
      } else if (formData.schedule_type === "CRON") {
        submitData.cron_minute = formData.cron_minute || '*';
        submitData.cron_hour = formData.cron_hour || '*';
        submitData.cron_day_of_week = formData.cron_day_of_week || '*';
        submitData.cron_day_of_month = formData.cron_day_of_month || '*';
        submitData.cron_month_of_year = formData.cron_month_of_year || '*';
      } else if (formData.schedule_type === "INTERVAL") {
        submitData.interval_seconds = parseInt(formData.interval_seconds);
      }

      const response = await api.post("tasks/", submitData);
      
      setSuccess("Task created successfully!");
      
      setFormData({
        name: "",
        description: "",
        schedule_type: "ONE_TIME",
        scheduled_time: "",
        cron_minute: "*",
        cron_hour: "*",
        cron_day_of_week: "*",
        cron_day_of_month: "*",
        cron_month_of_year: "*",
        interval_seconds: 3600,
        max_retries: 3,
        retry_delay: 60,
      });
      
      if (onTaskCreated) {
        onTaskCreated(response.data);
      }
      
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (err) {
      console.error("Submission error:", err.response?.data || err);
      const errorData = err.response?.data;
      if (errorData) {
        setErrors(errorData);
      } else {
        setErrors({ form: "An error occurred while creating the task" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScheduleTypeIcon = (type) => {
    switch (type) {
      case "ONE_TIME": return <CalendarClock className="w-5 h-5" />;
      case "CRON": return <Repeat className="w-5 h-5" />;
      case "INTERVAL": return <Timer className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const scheduleTypes = [
    { 
      value: "ONE_TIME", 
      label: "One Time", 
      icon: CalendarClock, 
      desc: "Execute once at specific time",
      color: "from-neonGreen-800 to-neonGreen-600"
    },
    { 
      value: "CRON", 
      label: "Recurring (Cron)", 
      icon: Repeat, 
      desc: "Recurring schedule using cron",
      color: "from-neonGreen-800 to-neonGreen-600"
    },
    { 
      value: "INTERVAL", 
      label: "Interval", 
      icon: Timer, 
      desc: "Repeat every N seconds",
      color: "from-neonGreen-800 to-neonGreen-600"
    },
  ];

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden transition-all duration-300 hover:border-gray-600">
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-4 sm:px-6 py-5 border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-neonGreen-500/10 rounded-lg">
            <CalendarClock className="w-6 h-6 text-neonGreen-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
              Create Scheduled Task
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Schedule one-time, recurring, or interval-based tasks
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        
        {errors.form && (
          <div className="p-3 sm:p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start space-x-3 animate-slideIn">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-red-300 text-sm">{errors.form}</span>
          </div>
        )}

        {success && (
          <div className="p-3 sm:p-4 bg-neonGreen-900/30 border border-neonGreen-500/50 rounded-xl flex items-start space-x-3 animate-slideIn">
            <CheckCircle className="w-5 h-5 text-neonGreen-400 flex-shrink-0 mt-0.5" />
            <span className="text-neonGreen-300 text-sm">{success}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-300">
            <Tag className="w-4 h-4 mr-2 text-neonGreen-400" />
            Task Name <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 pl-10 bg-gray-900/50 text-white rounded-xl border ${
                errors.name ? "border-red-500/70" : "border-gray-700/70"
              } focus:border-neonGreen-500 focus:ring-2 focus:ring-neonGreen-500/30 outline-none transition-all placeholder-gray-500`}
              placeholder="e.g., Daily Database Backup"
            />
            <Tag className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
          </div>
          {errors.name && (
            <p className="text-sm text-red-400 flex items-center mt-1">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-300">
            <FileText className="w-4 h-4 mr-2 text-neonGreen-400" />
            Description
          </label>
          <div className="relative">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 pl-10 bg-gray-900/50 text-white rounded-xl border border-gray-700/70 focus:border-neonGreen-500 focus:ring-2 focus:ring-neonGreen-500/30 outline-none transition-all placeholder-gray-500 resize-none"
              placeholder="Describe what this task does..."
            />
            <FileText className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-300">
            <Calendar className="w-4 h-4 mr-2 text-neonGreen-400" />
            Schedule Type <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scheduleTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.schedule_type === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, schedule_type: type.value }))}
                  className={`relative group p-4 rounded-xl border-2 transition-all duration-300 ${
                    isSelected
                      ? `bg-gradient-to-br ${type.color} border-transparent shadow-lg shadow-${type.color.split('-')[1]}-500/20 scale-[1.02]`
                      : "bg-gray-900/50 border-gray-700/70 hover:border-gray-600 hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-2 rounded-lg mb-2 transition-all duration-300 ${
                      isSelected 
                        ? "bg-white/20" 
                        : "bg-gray-800 group-hover:bg-gray-700"
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isSelected ? "text-white" : "text-gray-400 group-hover:text-gray-300"
                      }`} />
                    </div>
                    <span className={`font-semibold text-sm mb-1 ${
                      isSelected ? "text-white" : "text-gray-300"
                    }`}>
                      {type.label}
                    </span>
                    <span className={`text-xs ${
                      isSelected ? "text-white/80" : "text-gray-500"
                    }`}>
                      {type.desc}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-neonGreen-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-900/30 rounded-xl p-4 sm:p-5 border border-gray-700/50 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-700/50">
            <div className="p-1.5 bg-neonGreen-500/10 rounded-lg">
              {getScheduleTypeIcon(formData.schedule_type)}
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              {formData.schedule_type === "ONE_TIME" && "One-Time Schedule"}
              {formData.schedule_type === "CRON" && "Cron Schedule"}
              {formData.schedule_type === "INTERVAL" && "Interval Schedule"}
            </h3>
          </div>

          {formData.schedule_type === "ONE_TIME" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Execution Date & Time <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pl-10 bg-gray-900 text-white rounded-xl border ${
                    errors.scheduled_time ? "border-red-500/70" : "border-gray-700/70"
                  } focus:border-neonGreen-500 focus:ring-2 focus:ring-neonGreen-500/30 outline-none transition-all`}
                />
                <Clock className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
              </div>
              {errors.scheduled_time && (
                <p className="text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.scheduled_time}
                </p>
              )}
              <p className="text-xs text-gray-500 flex items-center">
                <ChevronRight className="w-3 h-3 mr-1" />
                The task will execute exactly at this time and then complete
              </p>
            </div>
          )}

          {formData.schedule_type === "CRON" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-400">Minute</label>
                  <input
                    type="text"
                    name="cron_minute"
                    value={formData.cron_minute}
                    onChange={handleChange}
                    placeholder="*"
                    className="w-full px-2 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-neonGreen-500 focus:ring-1 focus:ring-neonGreen-500 outline-none text-center"
                  />
                  <span className="text-xs text-gray-500 block">0-59, *, */5</span>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-400">Hour</label>
                  <input
                    type="text"
                    name="cron_hour"
                    value={formData.cron_hour}
                    onChange={handleChange}
                    placeholder="*"
                    className="w-full px-2 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-neonGreen-500 focus:ring-1 focus:ring-neonGreen-500 outline-none text-center"
                  />
                  <span className="text-xs text-gray-500 block">0-23, *, */2</span>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-400">Day (Month)</label>
                  <input
                    type="text"
                    name="cron_day_of_month"
                    value={formData.cron_day_of_month}
                    onChange={handleChange}
                    placeholder="*"
                    className="w-full px-2 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-neonGreen-500 focus:ring-1 focus:ring-neonGreen-500 outline-none text-center"
                  />
                  <span className="text-xs text-gray-500 block">1-31, *, */2</span>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-400">Month</label>
                  <input
                    type="text"
                    name="cron_month_of_year"
                    value={formData.cron_month_of_year}
                    onChange={handleChange}
                    placeholder="*"
                    className="w-full px-2 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-neonGreen-500 focus:ring-1 focus:ring-neonGreen-500 outline-none text-center"
                  />
                  <span className="text-xs text-gray-500 block">1-12, *, */2</span>
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-400">Day (Week)</label>
                  <input
                    type="text"
                    name="cron_day_of_week"
                    value={formData.cron_day_of_week}
                    onChange={handleChange}
                    placeholder="*"
                    className="w-full px-2 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-neonGreen-500 focus:ring-1 focus:ring-neonGreen-500 outline-none text-center"
                  />
                  <span className="text-xs text-gray-500 block">0-6, MON-SUN</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 flex items-center">
                <ChevronRight className="w-3 h-3 mr-1" />
                Task will execute according to the cron schedule
              </p>
            </div>
          )}

          {formData.schedule_type === "INTERVAL" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Interval (seconds) <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <input
                    type="number"
                    name="interval_seconds"
                    value={formData.interval_seconds}
                    onChange={handleChange}
                    min="60"
                    step="60"
                    className={`w-full px-4 py-3 pl-10 bg-gray-900 text-white rounded-xl border ${
                      errors.interval_seconds ? "border-red-500/70" : "border-gray-700/70"
                    } focus:border-neonGreen-500 focus:ring-2 focus:ring-neonGreen-500/30 outline-none transition-all`}
                  />
                  <Timer className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                </div>
                <span className="text-sm text-gray-400 px-2 py-1 bg-gray-900/50 rounded-lg border border-gray-700">
                  {Math.floor(formData.interval_seconds / 60)} minutes
                </span>
              </div>
              {errors.interval_seconds && (
                <p className="text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.interval_seconds}
                </p>
              )}
              <p className="text-xs text-gray-500 flex items-center">
                <ChevronRight className="w-3 h-3 mr-1" />
                Task will repeat every X seconds (minimum 60 seconds)
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-700/50 pt-4">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="flex items-center justify-between w-full text-gray-300 hover:text-white transition-colors group"
          >
            <span className="flex items-center text-sm font-medium">
              <Settings className="w-4 h-4 mr-2 text-gray-400 group-hover:text-neonGreen-400 transition-colors" />
              Advanced Options
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isAdvancedOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden transition-all duration-300 ${
            isAdvancedOpen ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0'
          }`}>
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-300">
                <Hash className="w-4 h-4 mr-2 text-neonGreen-400" />
                Max Retries
              </label>
              <input
                type="number"
                name="max_retries"
                value={formData.max_retries}
                onChange={handleChange}
                min="0"
                max="10"
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-neonGreen-500 focus:ring-2 focus:ring-neonGreen-500/30 outline-none transition-all"
              />
              <p className="text-xs text-gray-500">Number of retry attempts on failure</p>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-300">
                <Timer className="w-4 h-4 mr-2 text-neonGreen-400" />
                Retry Delay (seconds)
              </label>
              <input
                type="number"
                name="retry_delay"
                value={formData.retry_delay}
                onChange={handleChange}
                min="10"
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-neonGreen-500 focus:ring-2 focus:ring-neonGreen-500/30 outline-none transition-all"
              />
              <p className="text-xs text-gray-500">Delay between retry attempts</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 px-6 py-3.5 bg-gradient-to-r from-neonGreen-600 to-neonGreen-500 hover:from-neonGreen-500 hover:to-neonGreen-400 text-white rounded-xl font-semibold flex items-center justify-center transition-all ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-neonGreen-500/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Task...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Create Scheduled Task
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setFormData({
                name: "",
                description: "",
                schedule_type: "ONE_TIME",
                scheduled_time: "",
                cron_minute: "*",
                cron_hour: "*",
                cron_day_of_week: "*",
                cron_day_of_month: "*",
                cron_month_of_year: "*",
                interval_seconds: 3600,
                max_retries: 3,
                retry_delay: 60,
              });
              setErrors({});
            }}
            className="px-6 py-3.5 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-medium flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] border border-gray-600/50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}