import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import {
  LogOut,
  User,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  MessageSquare
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationService.getNotifications(20);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const renderNotifIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />;
      case 'TASK_DUE_SOON':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      case 'TASK_RETURNED':
        return <RotateCcw className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <ArrowRight className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Manager':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Employee':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-xs text-sm">
          A
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">Actowiz CRM</h1>
          <p className="text-[11px] text-slate-500 font-medium">Role-Based Task Manager</p>
        </div>
      </div>

      {user && (
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                if (!isOpen) fetchNotifications();
              }}
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold text-slate-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      disabled={loading}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={(e) => !n.isRead && handleMarkAsRead(n._id, e)}
                        className={`p-3 text-xs flex items-start space-x-2.5 transition cursor-pointer ${
                          n.isRead ? 'bg-white hover:bg-slate-50/60' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                        }`}
                      >
                        <div className="p-1 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                          {renderNotifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`leading-snug ${n.isRead ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center">
                            <Clock className="w-2.5 h-2.5 mr-1" />
                            {formatTime(n.createdAt)}
                          </p>
                        </div>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-none">{user.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-none">{user.email}</p>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeClass(user.role)}`}>
              {user.role}
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 text-xs font-medium transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      )}
    </header>
  );
}
