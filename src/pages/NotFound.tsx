import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { LuLayoutDashboard as Home } from "react-icons/lu";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="rounded-xl border border-border bg-card shadow-sm p-8 sm:p-12 max-w-md w-full text-center">
        <p className="font-display font-bold text-6xl sm:text-7xl text-primary tracking-tight">404</p>
        <h1 className="font-display font-semibold text-xl sm:text-2xl text-foreground mt-4">
          Page not found
        </h1>
        <p className="text-body text-muted-foreground mt-2">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-xl bg-primary hover:bg-[hsl(var(--primary-hover))] text-primary-foreground font-semibold text-body transition-colors focus-ring"
        >
          <Home className="w-4 h-4" />
          Return to Home
        </Link>
      </div>
    </div>
  );
}
