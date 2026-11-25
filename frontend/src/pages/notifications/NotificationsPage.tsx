import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { SystemNotification } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import {
  Bell,
  CheckCheck,
  Check,
  AlertTriangle,
  Info,
  ShieldAlert,
  Cpu,
  Clock,
  Filter,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get<{ success: boolean; data: SystemNotification[]; count?: number }>(
        '/notifications'
      ),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationsData?.data || [];

  const filteredNotifications = notifications.filter((item) => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (filterStatus === 'UNREAD' && item.isRead) return false;
    if (filterStatus === 'READ' && !item.isRead) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMERGENCY':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'CONTROLLER':
      case 'HARDWARE':
        return <Cpu className="w-5 h-5 text-amber-500" />;
      case 'INCIDENT':
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'EMERGENCY':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CONTROLLER':
      case 'HARDWARE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'INCIDENT':
      case 'WARNING':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Notifications & Alerts"
        description="Real-time operational alerts, controller status changes, and priority event dispatches."
        actions={
          unreadCount > 0 ? (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-blue-600" />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter Feed:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
            {['ALL', 'UNREAD', 'READ'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  filterStatus === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Category:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories</option>
            <option value="EMERGENCY">Emergency Priority</option>
            <option value="CONTROLLER">Controller & Hardware</option>
            <option value="INCIDENT">Traffic Incidents</option>
            <option value="SYSTEM">System & Configuration</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingSkeleton count={5} />
      ) : error ? (
        <ErrorState
          title="Failed to load notifications"
          message="Could not retrieve recent notifications from the central server."
          onRetry={() => refetch()}
        />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title="No notifications found"
          description={
            filterStatus !== 'ALL' || filterType !== 'ALL'
              ? 'No notifications match the active filter criteria.'
              : 'You have no system notifications at this time.'
          }
          icon={Bell}
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                item.isRead
                  ? 'bg-white border-slate-200/80 shadow-xs'
                  : 'bg-blue-50/30 border-blue-200 shadow-xs'
              }`}
            >
              <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getTypeBadgeClass(
                        item.type
                      )}`}
                    >
                      {item.type}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {item.title}
                    </h4>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
                    {item.message}
                  </p>
                  <div className="flex items-center space-x-4 text-[11px] text-slate-400">
                    <span className="inline-flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </span>
                    {item.intersectionId && (
                      <span className="font-semibold text-slate-500">
                        Crossing Ref: {item.intersectionId.substring(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!item.isRead && (
                <button
                  onClick={() => markReadMutation.mutate(item.id)}
                  disabled={markReadMutation.isPending}
                  className="shrink-0 p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all text-xs font-medium"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
