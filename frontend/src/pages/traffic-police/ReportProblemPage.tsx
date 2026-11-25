import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Intersection } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { FileWarning, CheckCircle, Upload, ArrowLeft, Car, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReportProblemPage: React.FC = () => {
  const navigate = useNavigate();

  const [category, setCategory] = useState<'TRAFFIC_VIOLATION' | 'TECHNICAL_INFRASTRUCTURE'>('TRAFFIC_VIOLATION');
  const [intersectionId, setIntersectionId] = useState('');
  const [problemType, setProblemType] = useState('Red Light Running');
  const [reportTimestamp, setReportTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState('');
  const [licensePlateNumber, setLicensePlateNumber] = useState('');
  const [urgency, setUrgency] = useState('HIGH');
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
    mutationFn: (data: any) => api.post('/traffic-problems', data),
    onSuccess: (res: any) => {
      setCreatedRef(res.data.referenceId);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to submit problem report.');
    },
  });

  const handleCategorySwitch = (cat: 'TRAFFIC_VIOLATION' | 'TECHNICAL_INFRASTRUCTURE') => {
    setCategory(cat);
    if (cat === 'TRAFFIC_VIOLATION') {
      setProblemType('Red Light Running');
      setUrgency('HIGH');
    } else {
      setProblemType('Traffic Light LED Hardware Failure');
      setUrgency('CRITICAL');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!intersectionId) {
      setErrorMsg('Please select an intersection location.');
      return;
    }

    createMutation.mutate({
      intersectionId,
      category,
      problemType,
      reportTimestamp,
      description,
      licensePlateNumber: category === 'TRAFFIC_VIOLATION' ? licensePlateNumber || undefined : undefined,
      urgency,
      evidenceFileUrls: photoUrl ? [photoUrl] : [],
    });
  };

  if (isLoading) return <LoadingSkeleton rows={5} className="py-8" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Report Traffic Problem or Violation"
        subtitle="Submit technical infrastructure malfunctions or flag vehicle traffic code violations."
        breadcrumbs={[
          { label: 'Problems', href: '/police/problems' },
          { label: 'Report New' },
        ]}
        action={
          <Link
            to="/police/problems"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-300 bg-white rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Problem Reports</span>
          </Link>
        }
      />

      {createdRef ? (
        <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-md text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Problem Report Registered</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            The issue has been stored in PostgreSQL and notification has been automatically dispatched to the System Administrator.
          </p>
          <div className="inline-block bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 font-mono text-sm font-bold text-amber-600">
            Reference ID: {createdRef}
          </div>
          <div className="pt-4 flex items-center justify-center space-x-3">
            <button
              onClick={() => {
                setCreatedRef(null);
                setDescription('');
                setLicensePlateNumber('');
                setPhotoUrl('');
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
            >
              Report Another Problem
            </button>
            <Link
              to="/police/problems"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              View My Reports
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm">
          {/* Category Toggle Tabs */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => handleCategorySwitch('TRAFFIC_VIOLATION')}
              className={`flex items-center justify-center space-x-2 py-3 rounded-lg text-xs font-bold transition-all ${
                category === 'TRAFFIC_VIOLATION'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Traffic Violation</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategorySwitch('TECHNICAL_INFRASTRUCTURE')}
              className={`flex items-center justify-center space-x-2 py-3 rounded-lg text-xs font-bold transition-all ${
                category === 'TECHNICAL_INFRASTRUCTURE'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Technical / Infrastructure Problem</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
              <FileWarning className="w-4 h-4 text-rose-600 flex-shrink-0" />
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
                  Problem Type
                </label>
                {category === 'TRAFFIC_VIOLATION' ? (
                  <select
                    value={problemType}
                    onChange={(e) => setProblemType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Red Light Running">Red Light Running</option>
                    <option value="Illegal U-Turn">Illegal U-Turn at Junction</option>
                    <option value="Lane Encroachment">Pedestrian Crosswalk Encroachment</option>
                    <option value="Reckless Driving">Speeding / Reckless Driving</option>
                    <option value="Unauthorized Parking">Junction Parking Blockage</option>
                  </select>
                ) : (
                  <select
                    value={problemType}
                    onChange={(e) => setProblemType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="Traffic Light LED Hardware Failure">Traffic Light LED Lamp Failure</option>
                    <option value="ESP32 Controller Power Fluctuation">Controller Power Fluctuation</option>
                    <option value="LCD 16x2 Display Glitch">LCD 16x2 Display Glitch / Corrupted Text</option>
                    <option value="Damaged Physical Signal Pole">Damaged Physical Signal Pole / Housing</option>
                    <option value="Broken Road Markings">Broken Road Markings / Signage</option>
                  </select>
                )}
              </div>
            </div>

            {/* Violation Specific Field: License Plate */}
            {category === 'TRAFFIC_VIOLATION' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Vehicle License Plate Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={licensePlateNumber}
                    onChange={(e) => setLicensePlateNumber(e.target.value)}
                    placeholder="e.g. ET-3-84920"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Date & Time of Violation
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={reportTimestamp}
                    onChange={(e) => setReportTimestamp(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            )}

            {/* Technical Infrastructure Field: Urgency Level */}
            {category === 'TECHNICAL_INFRASTRUCTURE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Urgency & Repair Priority
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="CRITICAL">Critical (Hardware blacked out - immediate hazard)</option>
                    <option value="HIGH">High (Single aspect defective)</option>
                    <option value="MEDIUM">Medium (Minor cosmetic or secondary issue)</option>
                    <option value="LOW">Low (Scheduled maintenance check)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Observation Timestamp
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={reportTimestamp}
                    onChange={(e) => setReportTimestamp(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Detailed Report Description
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide accurate description of the violation or technical fault observed..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Supporting Photo Attachment Link (Optional)
              </label>
              <div className="relative">
                <Upload className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/uploads/photo.jpg"
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/police/problems')}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
