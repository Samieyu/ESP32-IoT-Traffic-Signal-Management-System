import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Intersection } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { IntersectionCard } from '../../components/traffic/IntersectionCard.js';
import { IntersectionMapView } from '../../components/traffic/IntersectionMapView.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';

export const AssignedIntersectionsPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['assignedIntersectionsList'],
    queryFn: () => api.get<{ success: boolean; data: Intersection[] }>('/monitoring/intersections'),
  });

  const intersections = data?.data || [];

  if (isLoading) return <LoadingSkeleton rows={5} className="py-8" />;
  if (error) return <ErrorState message="Could not load assigned crossings." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Patrol Crossings & Intersections"
        subtitle="Operational overview and controller statuses for your assigned traffic management areas."
      />

      {/* Map View of Assigned Intersections */}
      {intersections.length > 0 && (
        <IntersectionMapView intersections={intersections} className="h-64" />
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {intersections.map((inter) => (
          <IntersectionCard key={inter.id} intersection={inter} userRole="TRAFFIC_POLICE" />
        ))}
      </div>
    </div>
  );
};
