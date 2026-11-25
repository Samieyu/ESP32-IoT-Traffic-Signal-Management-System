import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { TrafficProblemReport } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { DataTable, Column } from '../../components/common/DataTable.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { FormDialog } from '../../components/common/FormDialog.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { FileWarning, Eye, CheckCircle } from 'lucide-react';

export const TrafficProblemsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<TrafficProblemReport | null>(null);
  const [newStatus, setNewStatus] = useState<string>('RESOLVED');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminProblems'],
    queryFn: () => api.get<{ success: boolean; data: TrafficProblemReport[] }>('/traffic-problems'),
  });

  const problems = data?.data || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/traffic-problems/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProblems'] });
      setSelectedReport(null);
    },
  });

  const handleOpenReview = (item: TrafficProblemReport) => {
    setSelectedReport(item);
    setNewStatus(item.status);
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    updateStatusMutation.mutate({
      id: selectedReport.id,
      status: newStatus,
    });
  };

  const columns: Column<TrafficProblemReport>[] = [
    {
      header: 'Reference ID',
      cell: (item) => (
        <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {item.referenceId}
        </span>
      ),
    },
    {
      header: 'Category & Problem',
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-800 block text-xs">{item.problemType}</span>
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            {item.category.replace(/_/g, ' ')}
          </span>
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
      header: 'Plate / Hardware Details',
      cell: (item) => (
        <span className="text-xs font-mono text-slate-700">
          {item.licensePlateNumber ? `Plate: ${item.licensePlateNumber}` : 'Infrastructure fault'}
        </span>
      ),
    },
    {
      header: 'Urgency',
      cell: (item) => <StatusBadge status={item.urgency} />,
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
  if (error) return <ErrorState message="Could not load problem reports." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traffic Problem Reports & Violations"
        subtitle="Review officer notices regarding red-light runners and hardware malfunctions (FR-7)."
      />

      <DataTable
        columns={columns}
        data={problems}
        searchPlaceholder="Search problems by reference ID, plate or problem type..."
        searchFilter={(item, q) =>
          item.referenceId.toLowerCase().includes(q) ||
          item.problemType.toLowerCase().includes(q) ||
          (item.licensePlateNumber && item.licensePlateNumber.toLowerCase().includes(q)) ||
          item.description.toLowerCase().includes(q)
        }
      />

      {/* Review Dialog */}
      <FormDialog
        isOpen={!!selectedReport}
        title={`Problem Review: ${selectedReport?.referenceId}`}
        subtitle={`Reported at ${selectedReport?.intersection?.name}`}
        onClose={() => setSelectedReport(null)}
      >
        {selectedReport && (
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-slate-900">{selectedReport.category.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Urgency:</span>
                <StatusBadge status={selectedReport.urgency} />
              </div>
              {selectedReport.licensePlateNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">License Plate:</span>
                  <span className="font-mono font-bold text-blue-600">{selectedReport.licensePlateNumber}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block mb-1">Description:</span>
                <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedReport.description}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Resolution Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="REPORTED">Reported (Received)</option>
                <option value="INVESTIGATING">Investigating / Maintenance Dispatched</option>
                <option value="RESOLVED">Resolved (Issue Addressed)</option>
                <option value="DISMISSED">Dismissed (False Report)</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
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
