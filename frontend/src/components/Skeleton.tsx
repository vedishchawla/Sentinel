/**
 * Skeleton loading components for dashboard panels.
 */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-secondary/60 rounded ${className}`} />
  );
}

export function SkeletonLine({ width = '100%' }: { width?: string }) {
  return <Skeleton className="h-3 rounded-full" style={{ width }} />;
}

export function PanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-72" />
      </div>
      <div className="border border-border rounded-lg p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-4 w-3/6" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </div>
  );
}

export function CodeSkeleton() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-secondary/30">
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="p-3 space-y-1.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-3 w-6 shrink-0" />
            <Skeleton className="h-3" style={{ width: `${30 + Math.random() * 60}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TerminalSkeleton() {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-secondary/10">
      <div className="px-3 py-2 border-b border-border bg-secondary/30 flex items-center gap-2">
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-muted" />
          <div className="h-2 w-2 rounded-full bg-muted" />
          <div className="h-2 w-2 rounded-full bg-muted" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="p-3 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-3 w-12 shrink-0" />
            <Skeleton className="h-3" style={{ width: `${40 + Math.random() * 50}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
