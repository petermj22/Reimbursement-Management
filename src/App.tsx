import React, { Suspense, lazy, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { MainLayout } from "@/components/layout/MainLayout";
import { CinematicLoader } from "@/components/CinematicLoader";
import { AnimatePresence } from "framer-motion";

// ── Route-based Code Splitting (reduces initial bundle) ──────────────────────
const LoginPage        = lazy(() => import("./pages/LoginPage"));
const DashboardPage    = lazy(() => import("./pages/DashboardPage"));
const ExpensesPage     = lazy(() => import("./pages/ExpensesPage"));
const NewExpensePage   = lazy(() => import("./pages/NewExpensePage"));
const ExpenseDetailPage = lazy(() => import("./pages/ExpenseDetailPage"));
const ApprovalsPage    = lazy(() => import("./pages/ApprovalsPage"));
const UsersPage        = lazy(() => import("./pages/UsersPage"));
const AnalyticsPage    = lazy(() => import("./pages/AnalyticsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const SettingsPage     = lazy(() => import("./pages/SettingsPage"));
const SecurityPage     = lazy(() => import("./pages/SecurityPage"));
const NotFound         = lazy(() => import("./pages/NotFound"));

// ── Minimal page-level loader (for lazy boundary fallback) ───────────────────
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="flex gap-2">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-indigo-500/60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 min
      gcTime: 1000 * 60 * 10,      // 10 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || "dummy-ms-client-id",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common'}`,
    redirectUri: "/",
  },
  cache: {
    cacheLocation: "sessionStorage" as const,
    storeAuthStateInCookie: false,
  }
};
const msalInstance = new PublicClientApplication(msalConfig);

// ── One-time Cinematic Loader Gate ───────────────────────────────────────────
const LOADER_SHOWN_KEY = "reimburseflow_loader_shown";
const LOADER_DURATION_MS = 3200;

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard"     element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="/expenses"      element={<Suspense fallback={<PageLoader />}><ExpensesPage /></Suspense>} />
          <Route path="/expenses/new"  element={<Suspense fallback={<PageLoader />}><NewExpensePage /></Suspense>} />
          <Route path="/expenses/:id"  element={<Suspense fallback={<PageLoader />}><ExpenseDetailPage /></Suspense>} />
          <Route path="/approvals"     element={<ProtectedRoute roles={['admin', 'manager']}><Suspense fallback={<PageLoader />}><ApprovalsPage /></Suspense></ProtectedRoute>} />
          <Route path="/users"         element={<ProtectedRoute roles={['admin']}><Suspense fallback={<PageLoader />}><UsersPage /></Suspense></ProtectedRoute>} />
          <Route path="/analytics"     element={<ProtectedRoute roles={['admin', 'manager']}><Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense></ProtectedRoute>} />
          <Route path="/notifications" element={<Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>} />
          <Route path="/settings"      element={<ProtectedRoute roles={['admin']}><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></ProtectedRoute>} />
          <Route path="/security"      element={<ProtectedRoute roles={['admin']}><Suspense fallback={<PageLoader />}><SecurityPage /></Suspense></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppWithLoader: React.FC = () => {
  const [showLoader, setShowLoader] = useState(() => {
    return !sessionStorage.getItem(LOADER_SHOWN_KEY);
  });

  useEffect(() => {
    if (showLoader) {
      const timer = setTimeout(() => {
        sessionStorage.setItem(LOADER_SHOWN_KEY, "true");
        setShowLoader(false);
      }, LOADER_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [showLoader]);

  return (
    <>
      <AnimatePresence>
        {showLoader && <CinematicLoader key="cinematic-loader" />}
      </AnimatePresence>

      <div
        style={{
          opacity: showLoader ? 0 : 1,
          transition: "opacity 0.4s ease",
          pointerEvents: showLoader ? "none" : "auto",
        }}
      >
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </div>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MsalProvider instance={msalInstance}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-dummyclientid.apps.googleusercontent.com'}>
        <TooltipProvider>
          <Sonner richColors position="top-right" />
          <ErrorBoundary>
            <AppWithLoader />
          </ErrorBoundary>
        </TooltipProvider>
      </GoogleOAuthProvider>
    </MsalProvider>
  </QueryClientProvider>
);

export default App;
