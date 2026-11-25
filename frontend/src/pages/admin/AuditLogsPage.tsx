import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { AuditLogItem } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { DataTable, Column } from '../../components/common/DataTable.js';
import { FormDialog } from '../../components/common/FormDialog.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { History, Eye, ShieldCheck, Terminal } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['auditLogsList'],
    queryFn: () => api.get<{ success: boolean; data: AuditLogItem[] }>('/audit-logs'),
  });

  const logs = data?.data || [];

  const columns: Column<AuditLogItem>[] = [
    {
      header: 'Action',
      cell: (item) => (
        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {item.action.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: 'Actor & Role',
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{item.userFullName || 'System'}</span>
          <span className="text-[10px] text-slate-400 font-mono uppercase">{item.userRole}</span>
        </div>
      ),
    },
    {
      header: 'Target Entity',
      cell: (item) => (
        <span className="text-xs text-slate-700">
          {item.entityType} {item.entityId ? `(${item.entityId.slice(0, 8)}...)` : ''}
        </span>
      ),
    },
    {
      header: 'IP Address',
      cell: (item) => <span className="font-mono text-xs text-slate-500">{item.ipAddress || 'Internal'}</span>,
    },
    {
      header: 'Timestamp',
      cell: (item) => (
        <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
      ),
    },
    {
      header: 'Payload Details',
      className: 'text-right',
      cell: (item) => (
        <button
          onClick={() => setSelectedLog(item)}
          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </button>
      ),
    },
  ];

  if (isLoading) return <LoadingSkeleton rows={5} className="py-8" />;
  if (error) return <ErrorState message="Could not load system audit records." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Immutable System Audit Logs"
        subtitle="Cryptographically traceable audit trail of administrative interventions, firmware configurations, and priority preemption events (NFR-16)."
      />

      <DataTable
        columns={columns}
        data={logs}
        searchPlaceholder="Search audit logs by action, actor, or entity..."
        searchFilter={(item, q) =>
          item.action.toLowerCase().includes(q) ||
          item.entityType.toLowerCase().includes(q) ||
          (item.userFullName && item.userFullName.toLowerCase().includes(q))
        }
      />

      {/* Inspect Dialog */}
      <FormDialog
        isOpen={!!selectedLog}
        title={`Audit Inspection: ${selectedLog?.action}`}
        subtitle={`Logged on ${selectedLog?.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : ''}`}
        onClose={() => setSelectedLog(null)}
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">Actor:</span>
                <span className="font-bold text-slate-900">{selectedLog.userFullName || 'System'} ({selectedLog.userRole})</span>
              </div>
              <div>
                <span className="text-slate-400 block">IP & Agent:</span>
                <span className="font-mono text-slate-600">{selectedLog.ipAddress || '127.0.0.1'}</span>
              </div>
            </div>

            {selectedLog.previousValues && (
              <div>
                <span className="font-bold text-slate-700 block mb-1">Previous Values:</span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto font-mono text-[11px]">
                  {JSON.stringify(selectedLog.previousValues, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.newValues && (
              <div>
                <span className="font-bold text-slate-700 block mb-1">New Applied Values:</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto font-mono text-[11px]">
                  {JSON.stringify(selectedLog.newValues, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </FormDialog>
    </div>
  );
};
