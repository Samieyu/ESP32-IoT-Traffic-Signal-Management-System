import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 4,
  className = '',
}) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      <div className="h-8 bg-slate-200 rounded-lg w-1/3 mb-4" />
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-14 bg-slate-200/80 rounded-xl" />
      ))}
    </div>
  );
};
