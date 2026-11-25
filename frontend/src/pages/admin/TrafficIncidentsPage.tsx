import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { TrafficIncident } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { DataTable, Column } from '../../components/common/DataTable.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { FormDialog } from '../../components/common/FormDialog.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { AlertTriangle, Eye, CheckCircle, ExternalLink } from 'lucide-react';

export const TrafficIncidentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedIncident, setSelectedIncident] = useState<TrafficIncident | null>(null);
  const [newStatus, setNewStatus] = useState<string>('RESOLVED');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminIncidents'],
    queryFn: () => api.get<{ success: boolean; data: TrafficIncident[] }>('/incidents'),
  });

  const incidents = data?.data || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      api.patch(`/incidents/${id}/status`, { status, additionalNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminIncidents'] });
      setSelectedIncident(null);
    },
  });

  const handleOpenReview = (inc: TrafficIncident) => {
    setSelectedIncident(inc);
    setNewStatus(inc.status);
    setReviewNotes('');
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    updateStatusMutation.mutate({
      id: selectedIncident.id,
      status: newStatus,
      notes: reviewNotes,
    });
  };

  const columns: Column<TrafficIncident>[] = [
    {
      header: 'Reference ID',
      cell: (item) => (
        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {item.referenceId}
        </span>
      ),
    },
    {
      header: 'Incident Type',
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-800 block text-xs">
            {item.incidentType.replace(/_/g, ' ')}
          </span>
          <span className="text-xs text-slate-500 line-clamp-1">{item.description}</span>
        </div>
      ),
    },
    {
      header: 'Intersection',
      cell: (item) => (
        <span className="text-xs font-medium text-slate-700">
          {item.intersection?.name || 'Unknown'}
        </span>
      ),
    },
    {
      header: 'Severity',
      cell: (item) => <StatusBadge status={item.severity} />,
    },
    {
      header: 'Reported By',
      cell: (item) => (
        <span className="text-xs text-slate-600">{item.reporter?.fullName || 'Officer'}</span>
      ),
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <button
          onClick={() => handleOpenReview(item)}
          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Review</span>
        </button>
      ),
    },
  ];

  if (isLoading) return <LoadingSkeleton rows={5} className="py-8" />;
  if (error) return <ErrorState message="Could not load incident logs." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traffic Incident Records & Investigation"
        subtitle="Central administrator review of all accidents, road obstructions, and emergency interventions (FR-6)."
      />

      <DataTable
        columns={columns}
        data={incidents}
        searchPlaceholder="Search incidents by reference ID, type, or description..."
        searchFilter={(item, q) =>
          item.referenceId.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.incidentType.toLowerCase().includes(q)
        }
      />

      {/* Review Dialog */}
      <FormDialog
        isOpen={!!selectedIncident}
        title={`Incident Review: ${selectedIncident?.referenceId}`}
        subtitle={`Reported at ${selectedIncident?.intersection?.name}`}
        onClose={() => setSelectedIncident(null)}
      >
        {selectedIncident && (
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Incident Type:</span>
                <span className="font-bold text-slate-900">{selectedIncident.incidentType.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Severity:</span>
                <StatusBadge status={selectedIncident.severity} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Occurred:</span>
                <span>{new Date(selectedIncident.incidentTimestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Officer:</span>
                <span>{selectedIncident.reporter?.fullName}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block mb-1">Description:</span>
                <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 font-medium leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>
              {selectedIncident.additionalNotes && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Field Notes:</span>
                  <p className="text-slate-700 bg-white p-2 rounded border border-slate-200">
                    {selectedIncident.additionalNotes}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Update Resolution Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="OPEN">Open (Pending action)</option>
                <option value="UNDER_REVIEW">Under Review / Investigation</option>
                <option value="RESOLVED">Resolved (Obstruction cleared)</option>
                <option value="CLOSED">Closed (Administrative signoff)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Administrative Notes
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Document actions taken or findings..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={updateStatusMutation.isPending}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        )}
      </FormDialog>
    </div>
  );
};
