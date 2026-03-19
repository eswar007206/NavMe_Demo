import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./pages/DashboardLayout";
import Overview from "./pages/Overview";
import TablePage from "./pages/TablePage";
import NavNodesActivity from "./pages/NavNodesActivity";
import Heatmap from "./pages/Heatmap";
import ZoneEditor from "./pages/ZoneEditor";
import EmergencySOS from "./pages/EmergencySOS";
import NotFound from "./pages/NotFound";
import AdminManagement from "./pages/AdminManagement";
import Analytics from "./pages/Analytics";
import { tableConfigs } from "./lib/tableConfig";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Navigate to="/" replace />} />

              {/* Protected dashboard routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Overview />} />
                <Route path="/user-activity" element={<NavNodesActivity />} />
                <Route path="/heatmap" element={<Heatmap />} />
                <Route path="/access-control" element={<Navigate to="/heatmap" replace />} />
                <Route path="/zone-editor" element={<ZoneEditor />} />
                <Route path="/emergency" element={<EmergencySOS />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/room-categories" element={<TablePage config={tableConfigs.ar_ropin_buildings} />} />
                <Route path="/room-information" element={<TablePage config={tableConfigs.ar_ropin_floors} />} />
                <Route path="/rooms" element={<TablePage config={tableConfigs.ar_ropin_zones} />} />
                <Route path="/pois" element={<TablePage config={tableConfigs.ar_ropin_pois} />} />
                <Route path="/passages" element={<TablePage config={tableConfigs.ar_ropin_entries} />} />
                <Route path="/users" element={<TablePage config={tableConfigs.ar_ropin_users} />} />
                <Route
                  path="/admin-management"
                  element={
                    <ProtectedRoute requireSuperAdmin>
                      <AdminManagement />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
