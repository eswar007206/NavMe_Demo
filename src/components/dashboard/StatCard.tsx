import { type ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, description, icon, className = "" }: StatCardProps) {
  return (
    <div
      className={`section-card flex flex-col min-h-[44px] ${className}`}
      role="group"
      aria-label={label}
    >
      {icon && (
        <div className="text-primary mb-2 [&>svg]:w-5 [&>svg]:h-5">
          {icon}
        </div>
      )}
      <div className="text-lg sm:text-xl font-display font-bold text-foreground tracking-tight">
        {value}
      </div>
      <p className="text-caption font-medium text-muted-foreground mt-0.5">{label}</p>
      {description && (
        <p className="text-caption text-muted-foreground/80 mt-0.5 truncate" title={description}>
          {description}
        </p>
      )}
    </div>
  );
}
