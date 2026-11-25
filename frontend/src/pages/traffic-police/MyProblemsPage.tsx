import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { TrafficProblemReport } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { DataTable, Column } from '../../components/common/DataTable.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { Plus, FileWarning, Eye, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyProblemsPage: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['myProblems', categoryFilter],
    queryFn: () =>
      api.get<{ success: boolean; data: TrafficProblemReport[] }>(
        `/traffic-problems${categoryFilter ? `?category=${categoryFilter}` : ''}`
      ),
  });

  const problems = data?.data || [];

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
      header: 'Plate / Hardware Details',
      cell: (item) => (
        <span className="text-xs font-mono text-slate-700">
          {item.licensePlateNumber ? `Plate: ${item.licensePlateNumber}` : 'Infrastructure defect'}
        </span>
      ),
    },
    {
      header: 'Urgency',
      cell: (item) => <StatusBadge status={item.urgency} />,
    },
    {
      header: 'Admin Notification',
      cell: (item) => (
        <span
          className={`inline-flex items-center text-[11px] font-semibold ${
            item.notificationStatus === 'SENT' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          {item.notificationStatus === 'SENT' ? 'Notified Admin' : 'Pending'}
        </span>
      ),
    },
    {
      header: 'Resolution Status',
      cell: (item) => <StatusBadge status={item.status} />,
    },
  ];

  if (isLoading) return <LoadingSkeleton rows={5} className="py-8" />;
  if (error) return <ErrorState message="Could not load your problem reports." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Reported Problems & Violations"
        subtitle="Track administrator investigation and maintenance response to your submitted field notices."
        action={
          <Link
            to="/police/problems/new"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Report Problem</span>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={problems}
        searchPlaceholder="Search problems by reference ID, plate or description..."
        searchFilter={(item, q) =>
          item.referenceId.toLowerCase().includes(q) ||
          item.problemType.toLowerCase().includes(q) ||
          (item.licensePlateNumber && item.licensePlateNumber.toLowerCase().includes(q)) ||
          item.description.toLowerCase().includes(q)
        }
      />
    </div>
  );
};
