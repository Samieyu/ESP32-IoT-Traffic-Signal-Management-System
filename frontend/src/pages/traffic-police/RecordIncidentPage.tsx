import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Intersection } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { AlertTriangle, CheckCircle, Upload, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RecordIncidentPage: React.FC = () => {
  const navigate = useNavigate();

  const [intersectionId, setIntersectionId] = useState('');
  const [incidentType, setIncidentType] = useState('ROAD_ACCIDENT');
  const [severity, setSeverity] = useState('MEDIUM');
  const [incidentTimestamp, setIncidentTimestamp] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [description, setDescription] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdRef, setCreatedRef] = useState<string | null>(null);

  // Fetch assigned intersections
  const { data: interData, isLoading } = useQuery({
    queryKey: ['myIntersections'],
    queryFn: () => api.get<{ success: boolean; data: Intersection[] }>('/intersections'),
  });

  const intersections = interData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/incidents', data),
    onSuccess: (res: any) => {
      setCreatedRef(res.data.referenceId);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to submit incident report.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!intersectionId) {
      setErrorMsg('Please select an intersection location.');
      return;
    }

    createMutation.mutate({
      intersectionId,
      incidentType,
      severity,
      incidentTimestamp,
      description,
      additionalNotes: additionalNotes || undefined,
      evidenceFileUrls: photoUrl ? [photoUrl] : [],
    });
  };

  if (isLoading) return <LoadingSkeleton rows={5} className="py-8" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Record Traffic Incident"
        subtitle="Log road accidents, obstructions, or emergency operations occurring at your assigned intersection."
        breadcrumbs={[
          { label: 'Incidents', href: '/police/incidents' },
          { label: 'Record New' },
        ]}
        action={
          <Link
            to="/police/incidents"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-300 bg-white rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Incidents</span>
          </Link>
        }
      />

      {createdRef ? (
        <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-md text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Incident Successfully Recorded</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Your report has been securely registered in the central database with permanent audit tracking.
          </p>
          <div className="inline-block bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 font-mono text-sm font-bold text-blue-600">
            Reference ID: {createdRef}
          </div>
          <div className="pt-4 flex items-center justify-center space-x-3">
            <button
              onClick={() => {
                setCreatedRef(null);
                setDescription('');
                setAdditionalNotes('');
                setPhotoUrl('');
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
            >
              Record Another Incident
            </button>
            <Link
              to="/police/incidents"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              View My Incidents
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Intersection Location
                </label>
                <select
                  required
                  value={intersectionId}
                  onChange={(e) => setIntersectionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Select Assigned Crossing --</option>
                  {intersections.map((inter) => (
                    <option key={inter.id} value={inter.id}>
                      {inter.code} — {inter.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Incident Type
                </label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ROAD_ACCIDENT">Road Accident</option>
                  <option value="ROAD_OBSTRUCTION">Road Obstruction / Stalled Vehicle</option>
                  <option value="EMERGENCY_INTERVENTION">Emergency Vehicle Escort</option>
                  <option value="OTHER">Other Traffic Incident</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Severity Level
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="LOW">Low (Minor flow impact)</option>
                  <option value="MEDIUM">Medium (Single lane obstruction)</option>
                  <option value="HIGH">High (Major backlog / Road hazard)</option>
                  <option value="CRITICAL">Critical (Total crossroad blockage)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Date and Time of Occurrence
                </label>
                <input
                  type="datetime-local"
                  required
                  value={incidentTimestamp}
                  onChange={(e) => setIncidentTimestamp(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Incident Description & Observations
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe involved vehicles, cause of accident, lane impact, and pedestrian safety..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Additional Notes & Actions Taken (Optional)
              </label>
              <textarea
                rows={2}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Tow truck requested, manual diversion deployed, medical assistance provided..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Supporting Photograph / Evidence Link (Optional)
              </label>
              <div className="relative">
                <Upload className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/uploads/accident-photo.jpg"
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/police/incidents')}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Submitting...' : 'Submit Incident Record'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
