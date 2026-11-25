import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Intersection, User } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { IntersectionCard } from '../../components/traffic/IntersectionCard.js';
import { DataTable, Column } from '../../components/common/DataTable.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { FormDialog } from '../../components/common/FormDialog.js';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import {
  Plus,
  LayoutGrid,
  List,
  MapPin,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const IntersectionManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingIntersection, setEditingIntersection] = useState<Intersection | null>(null);
  const [deletingIntersection, setDeletingIntersection] = useState<Intersection | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('Central Ethiopia');
  const [city, setCity] = useState('Hosanna');
  const [latitude, setLatitude] = useState('8.0200');
  const [longitude, setLongitude] = useState('37.8500');
  const [approachesCount, setApproachesCount] = useState(4);
  const [deviceId, setDeviceId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Intersections
  const { data: interData, isLoading, error, refetch } = useQuery({
    queryKey: ['intersections', statusFilter],
    queryFn: () =>
      api.get<{ success: boolean; data: Intersection[] }>(
        `/intersections${statusFilter ? `?status=${statusFilter}` : ''}`
      ),
  });

  const intersections = interData?.data || [];

  // Register Intersection Mutation
  const registerMutation = useMutation({
    mutationFn: (data: any) => api.post('/intersections', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intersections'] });
      setIsRegisterOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to register intersection.');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/intersections/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intersections'] });
      setEditingIntersection(null);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update intersection.');
    },
  });

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      api.patch(`/intersections/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intersections'] });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/intersections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intersections'] });
      setDeletingIntersection(null);
    },
  });

  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setRegion('Central Ethiopia');
    setCity('Hosanna');
    setLatitude('8.0200');
    setLongitude('37.8500');
    setApproachesCount(4);
    setDeviceId('');
    setFormError(null);
  };

  const handleOpenRegister = () => {
    resetForm();
    setIsRegisterOpen(true);
  };

  const handleOpenEdit = (item: Intersection) => {
    setEditingIntersection(item);
    setCode(item.code);
    setName(item.name);
    setDescription(item.description || '');
    setRegion(item.region);
    setCity(item.city);
    setLatitude(String(item.latitude));
    setLongitude(String(item.longitude));
    setApproachesCount(item.approachesCount);
    setDeviceId(item.controller?.deviceId || '');
    setFormError(null);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    registerMutation.mutate({
      code,
      name,
      description,
      region,
      city,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      approachesCount,
      deviceId: deviceId || undefined,
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntersection) return;
    setFormError(null);
    updateMutation.mutate({
      id: editingIntersection.id,
      data: {
        name,
        description,
        region,
        city,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        approachesCount,
        deviceId: deviceId || undefined,
      },
    });
  };

  const columns: Column<Intersection>[] = [
    {
      header: 'Code',
      cell: (item) => (
        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {item.code}
        </span>
      ),
    },
    {
      header: 'Intersection Name',
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-900 block">{item.name}</span>
          <span className="text-xs text-slate-400">
            {item.city}, {item.region}
          </span>
        </div>
      ),
    },
    {
      header: 'Approaches',
      cell: (item) => <span className="text-xs font-semibold text-slate-700">{item.approachesCount} Ways</span>,
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: 'ESP32 Device',
      cell: (item) => (
        <span className="text-xs font-mono text-slate-600">
          {item.controller?.deviceId || 'Not Assigned'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end space-x-1">
          <Link
            to={`/admin/intersections/${item.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            to={`/admin/signal-configuration?intersectionId=${item.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Configure Timings"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Edit Intersection"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              statusMutation.mutate({
                id: item.id,
                status: item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
              })
            }
            className={`p-1.5 rounded-lg transition-colors ${
              item.status === 'ACTIVE'
                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            title={item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          >
            {item.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setDeletingIntersection(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete / Deactivate"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingSkeleton rows={5} className="py-6" />;
  if (error) return <ErrorState message="Could not fetch intersections." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intersection Registry & Asset Management"
        subtitle="Manage crossroad locations, GPS coordinates, approach configurations, and ESP32 controller links."
        action={
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleOpenRegister}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Register Intersection</span>
            </button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <span className="font-bold text-slate-500 uppercase tracking-wider">Status:</span>
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1 rounded-lg font-medium transition-colors ${
            statusFilter === '' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({intersections.length})
        </button>
        <button
          onClick={() => setStatusFilter('ACTIVE')}
          className={`px-3 py-1 rounded-lg font-medium transition-colors ${
            statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter('INACTIVE')}
          className={`px-3 py-1 rounded-lg font-medium transition-colors ${
            statusFilter === 'INACTIVE' ? 'bg-slate-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Inactive
        </button>
      </div>

      {/* Content: Grid or Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {intersections.map((inter) => (
            <IntersectionCard key={inter.id} intersection={inter} userRole="ADMIN" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={intersections}
          searchPlaceholder="Search intersection by name, code or city..."
          searchFilter={(item, q) =>
            item.name.toLowerCase().includes(q) ||
            item.code.toLowerCase().includes(q) ||
            item.city.toLowerCase().includes(q)
          }
        />
      )}

      {/* Register Intersection Dialog */}
      <FormDialog
        isOpen={isRegisterOpen}
        title="Register New Traffic Intersection"
        subtitle="Specify crossroad location, geographic coordinates, and connect an ESP32 edge controller."
        onClose={() => setIsRegisterOpen(false)}
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unique Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. INT-WCU-004"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">ESP32 Device ID</label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="e.g. ESP32-WCU-004"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Intersection Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wachemo University South Gate"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City / Town</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Hosanna"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Region</label>
              <input
                type="text"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Central Ethiopia"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Approaches</label>
              <input
                type="number"
                min="3"
                max="6"
                required
                value={approachesCount}
                onChange={(e) => setApproachesCount(parseInt(e.target.value) || 4)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Arterial corridor connecting university campus with regional highway."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {registerMutation.isPending ? 'Registering...' : 'Register Intersection'}
            </button>
          </div>
        </form>
      </FormDialog>

      {/* Edit Intersection Dialog */}
      <FormDialog
        isOpen={!!editingIntersection}
        title="Update Intersection Information"
        onClose={() => setEditingIntersection(null)}
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Intersection Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Region</label>
              <input
                type="text"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Approaches</label>
              <input
                type="number"
                min="3"
                max="6"
                required
                value={approachesCount}
                onChange={(e) => setApproachesCount(parseInt(e.target.value) || 4)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">ESP32 Device ID</label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="e.g. ESP32-WCU-001"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingIntersection(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </FormDialog>

      {/* Delete / Deactivate Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingIntersection}
        title="Confirm Intersection Removal"
        description={`Are you sure you want to delete ${deletingIntersection?.name} (${deletingIntersection?.code})? In compliance with FR-3, intersections with associated operational history (recorded incidents, problem reports, emergency interventions) will be deactivated to preserve historical information.`}
        confirmLabel="Proceed"
        isDestructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingIntersection) {
            deleteMutation.mutate(deletingIntersection.id);
          }
        }}
        onCancel={() => setDeletingIntersection(null)}
      />
    </div>
  );
};
