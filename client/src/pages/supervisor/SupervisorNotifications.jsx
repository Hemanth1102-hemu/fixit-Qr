import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  FileCheck2, 
  RotateCcw, 
  Clock, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { SupervisorHeader } from '../../components/supervisor/SupervisorHeader';
import { EmptyState } from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

export function SupervisorNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/supervisor/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('[SUPERVISOR_NOTIFICATIONS_ERROR]', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await apiRequest(`/supervisor/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/supervisor/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <SupervisorHeader 
        title="Supervisor Notifications & Alerts"
        subtitle="Priority operational dispatch feed. Live alerts for urgent equipment failures, SLA breaches, and completion sign-off requests."
        breadcrumbs={[{ label: 'Notifications' }]}
        onRefresh={loadNotifications}
        refreshing={loading}
        actions={
          unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition shadow-2xs"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              Mark all as read
            </button>
          )
        }
      />

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-8">
          <EmptyState 
            icon={Bell}
            title="All caught up"
            description="You have no unread maintenance notifications or pending escalation alerts."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div 
              key={n.id}
              className={`p-4 sm:p-5 rounded-2xl border transition flex items-start justify-between gap-4 ${n.is_read ? 'bg-white border-stone-200/70 text-stone-600' : 'bg-amber-50/40 border-amber-200 text-stone-900 shadow-2xs'}`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${n.is_read ? 'bg-stone-100 text-stone-500' : 'bg-amber-100 text-amber-900'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    {n.title}
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    )}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-2 font-medium">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.complaint_id && (
                  <Link
                    to={`/supervisor/complaints?search=${n.complaint?.complaint_number || ''}`}
                    className="p-1.5 text-xs text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                    title="View related ticket"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1.5 text-xs text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
