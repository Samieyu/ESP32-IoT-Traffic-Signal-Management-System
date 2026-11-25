import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { GeneratedReport, Intersection } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { DataTable, Column } from '../../components/common/DataTable.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { FormDialog } from '../../components/common/FormDialog.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import {
  FileBarChart,
  FileText,
  FileSpreadsheet,
  Download,
  Plus,
  Calendar,
  Filter,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  // Form states
  const [reportType, setReportType] = useState('INCIDENTS');
  const [intersectionId, setIntersectionId] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [exportFormat, setExportFormat] = useState<'PDF' | 'EXCEL'>('PDF');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Reports
  const { data: reportsData, isLoading, error, refetch } = useQuery({
    queryKey: ['generatedReports'],
    queryFn: () => api.get<{ success: boolean; data: GeneratedReport[] }>('/reports'),
  });

  // Fetch Intersections
  const { data: interData } = useQuery({
    queryKey: ['reportIntersections'],
    queryFn: () => api.get<{ success: boolean; data: Intersection[] }>('/intersections'),
  });

  const reports = reportsData?.data || [];
  const intersections = interData?.data || [];

  const generateMutation = useMutation({
    mutationFn: (data: any) => api.post('/reports/generate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generatedReports'] });
      setIsGenerateOpen(false);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to generate report.');
    },
  });

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    generateMutation.mutate({
      reportType,
      intersectionId: intersectionId || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      exportFormat,
    });
  };

  const handleDownload = async (reportId: string, format: 'PDF' | 'EXCEL', refId: string) => {
    try {
      const endpoint = format === 'PDF' ? `/reports/${reportId}/pdf` : `/reports/${reportId}/excel`;
      const blob = await api.get<Blob>(endpoint);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Report_${refId}.${format === 'PDF' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Download failed: ${err.message || 'Could not export file.'}`);
    }
  };

  const columns: Column<GeneratedReport>[] = [
    {
      header: 'Reference ID',
      cell: (item) => (
        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {item.referenceId}
        </span>
      ),
    },
    {
      header: 'Report Title & Category',
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-800 block text-xs">{item.title}</span>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            {item.reportType.replace(/_/g, ' ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Scope Location',
      cell: (item) => (
        <span className="text-xs text-slate-700 font-medium">
          {item.intersectionName || 'All Intersections'}
        </span>
      ),
    },
    {
      header: 'Date Window',
      cell: (item) => (
        <span className="text-xs text-slate-500">
          {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Author',
      cell: (item) => <span className="text-xs text-slate-600">{item.generatedBy || 'System'}</span>,
    },
    {
      header: 'Export & Download',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handleDownload(item.id, 'PDF', item.referenceId)}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
            title="Download PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => handleDownload(item.id, 'EXCEL', item.referenceId)}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingSkeleton rows={5} className="py-8" />;
  if (error) return <ErrorState message="Could not load reports." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traffic Analytics & Generated Reports"
        subtitle="Generate, preview and download formal institutional audit reports in formatted PDF or Excel worksheets (FR-5, FR-10)."
        action={
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Report</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={reports}
        searchPlaceholder="Search reports by title, reference ID, or category..."
        searchFilter={(item, q) =>
          item.title.toLowerCase().includes(q) ||
          item.referenceId.toLowerCase().includes(q) ||
          item.reportType.toLowerCase().includes(q)
        }
      />

      {/* Generate Report Dialog */}
      <FormDialog
        isOpen={isGenerateOpen}
        title="Generate System Traffic Report"
        subtitle="Choose target dataset, date parameters, and export format."
        onClose={() => setIsGenerateOpen(false)}
      >
        <form onSubmit={handleGenerateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Report Category Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="INCIDENTS">Traffic Incidents & Road Obstructions</option>
              <option value="PROBLEMS">All Traffic Problems & Hardware Defects</option>
              <option value="VIOLATIONS">Traffic Code Violations (Red light runners)</option>
              <option value="TECHNICAL">Technical Infrastructure & Controller Failures</option>
              <option value="EMERGENCY">Emergency Priority Preemption Log</option>
              <option value="OPERATIONAL">Intersection Operational Status Overview</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Target Intersection Scope
            </label>
            <select
              value={intersectionId}
              onChange={(e) => setIntersectionId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            >
              {user?.role === 'ADMIN' && <option value="">-- All Intersections --</option>}
              {intersections.map((inter) => (
                <option key={inter.id} value={inter.id}>
                  {inter.code} — {inter.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Primary Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center space-x-2 p-3 rounded-lg border text-xs font-bold cursor-pointer ${
                  exportFormat === 'PDF'
                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  checked={exportFormat === 'PDF'}
                  onChange={() => setExportFormat('PDF')}
                  className="hidden"
                />
                <FileText className="w-4 h-4 text-rose-600" />
                <span>PDF Document</span>
              </label>

              <label
                className={`flex items-center space-x-2 p-3 rounded-lg border text-xs font-bold cursor-pointer ${
                  exportFormat === 'EXCEL'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  checked={exportFormat === 'EXCEL'}
                  onChange={() => setExportFormat('EXCEL')}
                  className="hidden"
                />
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Excel Spreadsheet</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsGenerateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generateMutation.isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {generateMutation.isPending ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </form>
      </FormDialog>
    </div>
  );
};
