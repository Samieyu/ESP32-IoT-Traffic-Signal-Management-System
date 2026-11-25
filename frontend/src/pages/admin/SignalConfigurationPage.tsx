import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Intersection, SignalConfiguration } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import {
  Sliders,
  ShieldCheck,
  AlertTriangle,
  History,
  CheckCircle,
  Radio,
  Clock,
  Tv,
} from 'lucide-react';

export const SignalConfigurationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch all intersections
  const { data: interData, isLoading: interLoading } = useQuery({
    queryKey: ['allIntersections'],
    queryFn: () => api.get<{ success: boolean; data: Intersection[] }>('/intersections'),
  });

  const intersections = interData?.data || [];
  const selectedIntersectionId =
    searchParams.get('intersectionId') || (intersections.length > 0 ? intersections[0].id : '');

  // Fetch Configuration for selected intersection
  const {
    data: configData,
    isLoading: configLoading,
    error: configError,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: ['intersectionConfiguration', selectedIntersectionId],
    queryFn: () =>
      api.get<{
        success: boolean;
        data: {
          activeConfiguration: SignalConfiguration | null;
          history: SignalConfiguration[];
          deliveryStatus: any;
        };
      }>(`/intersections/${selectedIntersectionId}/configuration`),
    enabled: !!selectedIntersectionId,
  });

  const activeConfig = configData?.data?.activeConfiguration;
  const configHistory = configData?.data?.history || [];
  const deliveryStatus = configData?.data?.deliveryStatus;

  // Form states
  const [nsGreen, setNsGreen] = useState<number>(30);
  const [ewGreen, setEwGreen] = useState<number>(30);
  const [yellow, setYellow] = useState<number>(4);
  const [allRed, setAllRed] = useState<number>(2);
  const [maxEmergency, setMaxEmergency] = useState<number>(60);
  const [lcdEnabled, setLcdEnabled] = useState<boolean>(true);
  const [lcdMode, setLcdMode] = useState<string>('COUNTDOWN_AND_PHASE');
  const [lcdMessage, setLcdMessage] = useState<string>('');
  const [countdownEnabled, setCountdownEnabled] = useState<boolean>(true);

  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [safetyError, setSafetyError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state when activeConfig loads
  useEffect(() => {
    if (activeConfig) {
      setNsGreen(activeConfig.northSouthGreenDuration);
      setEwGreen(activeConfig.eastWestGreenDuration);
      setYellow(activeConfig.yellowDuration);
      setAllRed(activeConfig.allRedClearanceDuration);
      setMaxEmergency(activeConfig.maxEmergencyPriorityDuration);
      setLcdEnabled(activeConfig.lcdEnabled);
      setLcdMode(activeConfig.lcdDisplayMode);
      setLcdMessage(activeConfig.lcdCustomMessage || '');
      setCountdownEnabled(activeConfig.countdownDisplayEnabled);
    }
  }, [activeConfig]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      api.put(`/intersections/${selectedIntersectionId}/configuration`, data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['intersectionConfiguration', selectedIntersectionId] });
      setConfirmOpen(false);
      setSuccessMessage(res.message || 'Configuration transmitted and verified on ESP32 controller.');
      setTimeout(() => setSuccessMessage(null), 8000);
    },
    onError: (err: any) => {
      setSafetyError(err.message || 'Configuration rejected by controller.');
    },
  });

  // Client safety validation before confirmation (NFR-14)
  const handleValidateAndOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setSafetyError(null);

    if (yellow < 3) {
      setSafetyError('Safety Violation (NFR-14): Yellow clearance duration must be at least 3 seconds.');
      return;
    }
    if (allRed < 1) {
      setSafetyError('Safety Violation (NFR-14): All-Red clearance interval must be at least 1 second to prevent opposing collisions.');
      return;
    }
    if (nsGreen < 10 || ewGreen < 10) {
      setSafetyError('Green signal duration must be at least 10 seconds.');
      return;
    }

    setConfirmOpen(true);
  };

  const handleApplyConfirmed = () => {
    updateMutation.mutate({
      northSouthGreenDuration: nsGreen,
      eastWestGreenDuration: ewGreen,
      yellowDuration: yellow,
      allRedClearanceDuration: allRed,
      maxEmergencyPriorityDuration: maxEmergency,
      lcdEnabled,
      lcdDisplayMode: lcdMode,
      lcdCustomMessage: lcdMessage,
      countdownDisplayEnabled: countdownEnabled,
    });
  };

  if (interLoading) return <LoadingSkeleton rows={5} className="py-8" />;

  const currentIntersection = intersections.find((i) => i.id === selectedIntersectionId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traffic Signal Timing & Firmware Configuration"
        subtitle="Manage fixed-time cycle intervals, clearance safety bounds, LCD messages, and MQTT hardware synchronization."
      />

      {/* Intersection Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Sliders className="w-5 h-5 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Select Intersection:
          </span>
          <select
            value={selectedIntersectionId}
            onChange={(e) => setSearchParams({ intersectionId: e.target.value })}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {intersections.map((inter) => (
              <option key={inter.id} value={inter.id}>
                {inter.code} — {inter.name}
              </option>
            ))}
          </select>
        </div>

        {/* MQTT Delivery Status Badge */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium">Controller Sync:</span>
          {deliveryStatus ? (
            <StatusBadge status={deliveryStatus.deliveryStatus} />
          ) : (
            <span className="text-slate-400 italic">No sync records</span>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {safetyError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{safetyError}</span>
        </div>
      )}

      {configLoading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Configuration Form */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Signal Interval Parameters</h3>
                <p className="text-xs text-slate-500">
                  Enforces NFR-14 Safety Constraints before MQTT transmission to ESP32
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-mono font-bold">
                Active Version: v{activeConfig?.version || 1}
              </span>
            </div>

            <form onSubmit={handleValidateAndOpenConfirm} className="space-y-6">
              {/* Timing Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    North-South Green Duration (Seconds)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">Safe Range: 10s – 180s</p>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    required
                    value={nsGreen}
                    onChange={(e) => setNsGreen(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    East-West Green Duration (Seconds)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">Safe Range: 10s – 180s</p>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    required
                    value={ewGreen}
                    onChange={(e) => setEwGreen(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                    Yellow Clearance Interval (Seconds)
                  </label>
                  <p className="text-[11px] text-amber-700 mb-2">Mandatory Safety: 3s – 7s</p>
                  <input
                    type="number"
                    min="3"
                    max="7"
                    required
                    value={yellow}
                    onChange={(e) => setYellow(parseInt(e.target.value) || 3)}
                    className="w-full px-3 py-2 text-sm font-bold bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200">
                  <label className="block text-xs font-bold text-rose-900 uppercase mb-1">
                    All-Red Clearance Deadzone (Seconds)
                  </label>
                  <p className="text-[11px] text-rose-700 mb-2">Mandatory Deadzone: 1s – 5s</p>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={allRed}
                    onChange={(e) => setAllRed(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm font-bold bg-white border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* Emergency Maximum Duration Ceiling */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase">
                      Maximum Emergency Priority Ceiling (Seconds)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Watchdog timeout inside ESP32 firmware to prevent indefinite green holds (15s – 120s)
                    </p>
                  </div>
                  <input
                    type="number"
                    min="15"
                    max="120"
                    required
                    value={maxEmergency}
                    onChange={(e) => setMaxEmergency(parseInt(e.target.value) || 60)}
                    className="w-24 px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-lg text-right"
                  />
                </div>
              </div>

              {/* LCD Display Settings */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Tv className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      16x2 I2C LCD Display Settings
                    </h4>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={lcdEnabled}
                      onChange={(e) => setLcdEnabled(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-700">Enable Hardware LCD</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Display Mode</label>
                    <select
                      value={lcdMode}
                      onChange={(e) => setLcdMode(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="COUNTDOWN_AND_PHASE">Countdown & Active Phase</option>
                      <option value="CUSTOM_MESSAGE">Custom Informational Banner</option>
                      <option value="COMBINED">Alternating Status & Message</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Custom LCD Text (Max 32 Chars)
                    </label>
                    <input
                      type="text"
                      maxLength={32}
                      value={lcdMessage}
                      onChange={(e) => setLcdMessage(e.target.value)}
                      placeholder="e.g. WCU Safe Crosswalk"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                >
                  Verify Safety & Apply Configuration
                </button>
              </div>
            </form>
          </div>

          {/* Side Panel: Preview & Version History */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Cycle Preview */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Proposed Total Cycle Time</span>
              </h3>

              <div className="text-center py-4 bg-slate-800/80 rounded-xl border border-slate-700 mb-4">
                <span className="text-4xl font-mono font-black text-emerald-400">
                  {nsGreen + ewGreen + yellow * 2 + allRed * 2}s
                </span>
                <span className="block text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                  Complete 4-Way Rotation
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Phase 1 (N-S Green):</span>
                  <span className="font-mono text-emerald-400 font-bold">{nsGreen}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Phase 2 (N-S Yellow):</span>
                  <span className="font-mono text-amber-400 font-bold">{yellow}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Phase 3 (All-Red Clearance):</span>
                  <span className="font-mono text-rose-400 font-bold">{allRed}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Phase 4 (E-W Green):</span>
                  <span className="font-mono text-emerald-400 font-bold">{ewGreen}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Phase 5 (E-W Yellow):</span>
                  <span className="font-mono text-amber-400 font-bold">{yellow}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Phase 6 (All-Red Clearance):</span>
                  <span className="font-mono text-rose-400 font-bold">{allRed}s</span>
                </div>
              </div>
            </div>

            {/* Version History Table */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Version History</span>
              </h3>

              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto text-xs">
                {configHistory.map((cfg) => (
                  <div key={cfg.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">Version {cfg.version}</span>
                      <span className="text-[10px] text-slate-400 block">
                        NS: {cfg.northSouthGreenDuration}s | EW: {cfg.eastWestGreenDuration}s
                      </span>
                    </div>
                    <StatusBadge status={cfg.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationDialog
        isOpen={confirmOpen}
        title="Confirm MQTT Configuration Push"
        description={`You are about to transmit Version ${(activeConfig?.version || 1) + 1} to the ESP32 controller at ${currentIntersection?.name}. The controller will complete its current cycle safely, apply the new timing parameters in NVS memory, and emit an acknowledgment.`}
        confirmLabel="Push to Controller"
        isLoading={updateMutation.isPending}
        onConfirm={handleApplyConfirmed}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};
