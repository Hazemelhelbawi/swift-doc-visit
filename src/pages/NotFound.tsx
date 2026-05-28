import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, LayoutDashboard, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    console.error("[404]", {
      path: location.pathname,
      search: location.search,
      hasUser: !!user,
      isAdmin,
    });
  }, [location.pathname, location.search, user, isAdmin]);

  // Smart primary action based on auth state
  const primary = isLoading
    ? null
    : user && isAdmin
      ? { to: "/admin", label: "Go to Dashboard", Icon: LayoutDashboard }
      : { to: "/", label: "Go to Home", Icon: Home };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <div className="text-7xl font-bold text-primary">404</div>
          <h1 className="text-2xl font-bold text-foreground">
            We couldn't find that page
          </h1>
          <p className="text-muted-foreground text-sm">
            The link <code className="px-1.5 py-0.5 rounded bg-muted text-xs">{location.pathname}</code> doesn't exist or has moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {primary && (
            <Button asChild size="lg">
              <Link to={primary.to}>
                <primary.Icon className="h-4 w-4 mr-2" />
                {primary.label}
              </Link>
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go back
          </Button>
        </div>

        {user && !isAdmin && (
          <p className="text-xs text-muted-foreground">
            Signed in but not an admin?{" "}
            <Link to="/auth" className="text-primary underline">Switch account</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default NotFound;
