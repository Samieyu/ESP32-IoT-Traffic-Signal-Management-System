import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Intersection, TrafficStatus, EmergencyOperation, EmergencyDirection, EmergencyMovement } from '../../types/index.js';
import { useSocket } from '../../context/SocketContext.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { TrafficSignalDisplay } from '../../components/traffic/TrafficSignalDisplay.js';
import { CountdownDisplay } from '../../components/traffic/CountdownDisplay.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import {
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Clock,
  StopCircle,
  AlertTriangle,
  History,
  CheckCircle,
} from 'lucide-react';

export const EmergencyPriorityPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { socket, joinIntersection, leaveIntersection } = useSocket();

  // Fetch assigned intersections
  const { data: interData, isLoading } = useQuery({
    queryKey: ['myAssignedIntersections'],
    queryFn: () => api.get<{ success: boolean; data: Intersection[] }>('/intersections'),
  });

  const intersections = interData?.data || [];
  const selectedIntersectionId =
    searchParams.get('intersectionId') || (intersections.length > 0 ? intersections[0].id : '');

  const [direction, setDirection] = useState<EmergencyDirection>('NORTH');
  const [movement, setMovement] = useState<EmergencyMovement>('STRAIGHT');
  const [duration, setDuration] = useState<number>(60);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeOp, setActiveOp] = useState<EmergencyOperation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Fetch active emergency operations for this intersection
  const { data: emergencyData, refetch: refetchEmergency } = useQuery({
    queryKey: ['emergencyStatus', selectedIntersectionId],
    queryFn: () =>
      api.get<{ success: boolean; data: EmergencyOperation[] }>(
        `/emergency-priorities?intersectionId=${selectedIntersectionId}&status=ACTIVE`
      ),
    enabled: !!selectedIntersectionId,
  });

  const activeExisting = emergencyData?.data?.[0] || null;

  useEffect(() => {
    if (activeExisting) {
      setActiveOp(activeExisting);
    } else {
      setActiveOp(null);
    }
  }, [activeExisting]);

  // Join intersection room
  useEffect(() => {
    if (!selectedIntersectionId) return;
    joinIntersection(selectedIntersectionId);

    if (socket) {
      const handleEmergencyUpdate = (data: any) => {
        if (data.operation) {
          if (data.operation.status === 'ACTIVE') {
            setActiveOp(data.operation);
            setStatusMsg('Emergency green active. Opposing approaches locked to Red.');
          } else if (
            data.operation.status === 'COMPLETED' ||
            data.operation.status === 'AUTO_TERMINATED'
          ) {
            setActiveOp(null);
            setStatusMsg(`Emergency preemption terminated: ${data.operation.status}. Resuming normal cycle.`);
            refetchEmergency();
          }
        }
      };

      socket.on('emergency_status_update', handleEmergencyUpdate);

      return () => {
        socket.off('emergency_status_update', handleEmergencyUpdate);
        leaveIntersection(selectedIntersectionId);
      };
    }
  }, [selectedIntersectionId, socket, joinIntersection, leaveIntersection, refetchEmergency]);

  // Mutation: Request Emergency
  const requestMutation = useMutation({
    mutationFn: (data: any) => api.post('/emergency-priorities', data),
    onSuccess: (res: any) => {
      setConfirmOpen(false);
      setStatusMsg(res.message);
      if (res.data?.status === 'ACTIVE') {
        setActiveOp(res.data);
      }
      queryClient.invalidateQueries({ queryKey: ['emergencyStatus', selectedIntersectionId] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Emergency priority request rejected.');
      setConfirmOpen(false);
    },
  });

  // Mutation: Terminate Emergency
  const terminateMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/emergency-priorities/${id}/terminate`, { reason }),
    onSuccess: (res: any) => {
      setActiveOp(null);
      setStatusMsg(res.message);
      queryClient.invalidateQueries({ queryKey: ['emergencyStatus', selectedIntersectionId] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Termination command failed.');
    },
  });

  const handleRequestClick = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    setConfirmOpen(true);
  };

  const handleConfirmExecute = () => {
    requestMutation.mutate({
      intersectionId: selectedIntersectionId,
      direction,
      movement,
      durationSeconds: duration,
    });
  };

  const handleManualTerminate = () => {
    if (!activeOp) return;
    terminateMutation.mutate({
      id: activeOp.id,
      reason: 'Officer manual termination: emergency vehicle has passed through crossroad.',
    });
  };

  if (isLoading) return <LoadingSkeleton rows={5} className="py-8" />;

  const currentIntersection = intersections.find((i) => i.id === selectedIntersectionId) || intersections[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Vehicle Signal Priority Preemption"
        subtitle="Request authorized green-wave preemption for approaching emergency response vehicles (FR-8, UC-11)."
        action={
          <Link
            to="/police/emergency-history"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-300 bg-white rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Emergency History</span>
          </Link>
        }
      />

      {/* Intersection Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Target Intersection:
          </span>
          <select
            value={selectedIntersectionId}
            onChange={(e) => setSearchParams({ intersectionId: e.target.value })}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            {intersections.map((inter) => (
              <option key={inter.id} value={inter.id}>
                {inter.code} — {inter.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <StatusBadge
            status={activeOp ? 'ACTIVE' : 'NORMAL'}
            type="emergency"
          />
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center space-x-2.5">
          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Active Preemption Warning / Termination Bar */}
      {activeOp && (
        <div className="bg-rose-600 text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-white/20 rounded-xl">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide">
                EMERGENCY PRIORITY IN PROGRESS ({activeOp.direction} APPROACH)
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                Reference ID: <span className="font-mono font-bold">{activeOp.referenceId}</span> • Movement:{' '}
                <strong>{activeOp.movement}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={handleManualTerminate}
            disabled={terminateMutation.isPending}
            className="w-full sm:w-auto px-6 py-3 bg-white text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          >
            {terminateMutation.isPending ? 'Terminating...' : 'End Emergency Priority Now'}
          </button>
        </div>
      )}

      {/* Main Grid: Control Panel & Live Signal Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step-by-Step Priority Request Form */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Initiate Emergency Preemption Request
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Controller validates movement safety, runs clearance yellow/all-red, and grants green.
            </p>
          </div>

          <form onSubmit={handleRequestClick} className="space-y-6">
            {/* Step 1: Direction Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Step 1: Emergency Vehicle Approaching Direction
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { dir: 'NORTH', label: 'North Approach', icon: ArrowUp },
                  { dir: 'SOUTH', label: 'South Approach', icon: ArrowDown },
                  { dir: 'EAST', label: 'East Approach', icon: ArrowRight },
                  { dir: 'WEST', label: 'West Approach', icon: ArrowLeft },
                ].map((item) => (
                  <button
                    key={item.dir}
                    type="button"
                    onClick={() => setDirection(item.dir as any)}
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                      direction === item.dir
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Movement Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Step 2: Intended Vehicle Movement
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['STRAIGHT', 'LEFT', 'RIGHT'].map((mov) => (
                  <button
                    key={mov}
                    type="button"
                    onClick={() => setMovement(mov as any)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      movement === mov
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {mov}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Requested Duration */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Step 3: Max Duration Clearance Ceiling
                </label>
                <span className="font-mono font-bold text-slate-900 text-xs">{duration} Seconds</span>
              </div>
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full accent-rose-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>15s (Quick)</span>
                <span>60s (Standard)</span>
                <span>120s (Maximum Limit)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!!activeOp || requestMutation.isPending}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md shadow-rose-600/30 disabled:opacity-50"
            >
              {requestMutation.isPending ? 'Communicating with ESP32...' : 'Review & Confirm Preemption Request'}
            </button>
          </form>
        </div>

        {/* Live Signal Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live Intersection Status Preview
            </h3>
            <span className="text-xs text-slate-400">Target Junction Feed</span>
          </div>

          <TrafficSignalDisplay
            status={currentIntersection?.liveStatus}
            intersectionName={currentIntersection?.name}
            intersectionCode={currentIntersection?.code}
            isOffline={currentIntersection?.controller?.connectionStatus === 'OFFLINE'}
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmOpen}
        title="Confirm Emergency Traffic Signal Priority"
        description={`You are requesting emergency green priority for the ${direction} approach (${movement} movement) at ${currentIntersection?.name} for up to ${duration} seconds. Opposing approaches will execute mandatory yellow and all-red clearance intervals before your approach receives solid Green.`}
        confirmLabel="Authorize Emergency Preemption"
        isDestructive
        isLoading={requestMutation.isPending}
        onConfirm={handleConfirmExecute}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};
