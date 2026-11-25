import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../api/client.js';
import { User, Intersection } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { DataTable, Column } from '../../components/common/DataTable.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { FormDialog } from '../../components/common/FormDialog.js';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import {
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TrafficPoliceManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [assigningUser, setAssigningUser] = useState<User | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedIntersections, setSelectedIntersections] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Officers
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['policeOfficers', statusFilter],
    queryFn: () =>
      api.get<{ success: boolean; data: User[] }>(
        `/users?role=TRAFFIC_POLICE${statusFilter ? `&status=${statusFilter}` : ''}`
      ),
  });

  // Fetch Intersections for assignment options
  const { data: intersectionsData } = useQuery({
    queryKey: ['allIntersections'],
    queryFn: () => api.get<{ success: boolean; data: Intersection[] }>('/intersections'),
  });

  const officers = usersData?.data || [];
  const intersections = intersectionsData?.data || [];

  // Create Officer Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policeOfficers'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create officer account.');
    },
  });

  // Update Officer Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policeOfficers'] });
      setEditingUser(null);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update account.');
    },
  });

  // Status Toggle Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      api.patch(`/users/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policeOfficers'] });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['policeOfficers'] });
      setDeletingUser(null);
    },
  });

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setPhoneNumber('');
    setSelectedIntersections([]);
    setFormError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFullName(user.fullName);
    setUsername(user.username);
    setEmail(user.email);
    setPhoneNumber(user.phoneNumber || '');
    setPassword('');
    setSelectedIntersections(user.assignments?.map((a) => a.intersectionId) || []);
    setFormError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate({
      fullName,
      username,
      email,
      password,
      phoneNumber,
      role: 'TRAFFIC_POLICE',
      assignedIntersectionIds: selectedIntersections,
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);
    const payload: any = {
      fullName,
      email,
      phoneNumber,
      assignedIntersectionIds: selectedIntersections,
    };
    if (password) {
      payload.password = password;
    }
    updateMutation.mutate({ id: editingUser.id, data: payload });
  };

  const columns: Column<User>[] = [
    {
      header: 'Officer Name & User',
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-900 block">{item.fullName}</span>
          <span className="text-xs text-slate-500 font-mono">@{item.username}</span>
        </div>
      ),
    },
    {
      header: 'Email & Contact',
      cell: (item) => (
        <div>
          <span className="text-xs text-slate-700 block">{item.email}</span>
          <span className="text-xs text-slate-400">{item.phoneNumber || 'No phone'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Assigned Crossings',
      cell: (item) => (
        <div>
          {item.assignments && item.assignments.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {item.assignments.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold"
                >
                  <MapPin className="w-2.5 h-2.5 mr-0.5 text-blue-500" />
                  {a.intersectionCode}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">No assignments</span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end space-x-1">
          <Link
            to={`/admin/traffic-police/${item.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Link>

          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Edit Officer"
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
            title={item.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
          >
            {item.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setDeletingUser(item)}
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
  if (error) return <ErrorState message="Could not fetch officer list." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traffic Police Personnel Management"
        subtitle="Provision field accounts, manage intersection patrol assignments, and review officer performance."
        action={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Officer</span>
          </button>
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
          All ({officers.length})
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

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={officers}
        searchPlaceholder="Search officer by name, username or email..."
        searchFilter={(item, q) =>
          item.fullName.toLowerCase().includes(q) ||
          item.username.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q)
        }
      />

      {/* Create Officer Dialog */}
      <FormDialog
        isOpen={isCreateOpen}
        title="Register New Traffic Police Officer"
        subtitle="Officer accounts are authenticated via bcrypt and authorized for assigned intersections only."
        onClose={() => setIsCreateOpen(false)}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Officer Abebe Kebede"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="officer_abebe"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+251911223344"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer.abebe@traffic.wcu.edu.et"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters with letters & numbers"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Assign Intersections (Optional)
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
              {intersections.map((inter) => (
                <label key={inter.id} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIntersections.includes(inter.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIntersections([...selectedIntersections, inter.id]);
                      } else {
                        setSelectedIntersections(selectedIntersections.filter((id) => id !== inter.id));
                      }
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                  <span>
                    <strong>{inter.code}</strong> - {inter.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </FormDialog>

      {/* Edit Officer Dialog */}
      <FormDialog
        isOpen={!!editingUser}
        title="Update Officer Information & Assignments"
        onClose={() => setEditingUser(null)}
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Reset Password (leave blank to keep current)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Update Assigned Intersections
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
              {intersections.map((inter) => (
                <label key={inter.id} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIntersections.includes(inter.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIntersections([...selectedIntersections, inter.id]);
                      } else {
                        setSelectedIntersections(selectedIntersections.filter((id) => id !== inter.id));
                      }
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                  <span>
                    <strong>{inter.code}</strong> - {inter.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
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
        isOpen={!!deletingUser}
        title="Confirm Account Deletion / Deactivation"
        description={`Are you sure you want to remove ${deletingUser?.fullName}? Per system specifications (FR-2), accounts with associated operational history (recorded incidents, problem reports, emergency interventions) will be deactivated rather than deleted to preserve audit trails.`}
        confirmLabel="Proceed"
        isDestructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingUser) {
            deleteMutation.mutate(deletingUser.id);
          }
        }}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
};
