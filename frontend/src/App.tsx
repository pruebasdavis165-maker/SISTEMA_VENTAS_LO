import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ZonasPage } from './pages/ZonasPage';
import { VendedoresPage } from './pages/VendedoresPage';
import { SorteosPage } from './pages/SorteosPage';
import { CuadriculaRiesgoPage } from './pages/CuadriculaRiesgoPage';
import { LiquidacionPage } from './pages/LiquidacionPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { useAuthStore } from './store/useAuthStore';

// Guardia de ruta pública para usuarios ya autenticados
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública de Login */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        {/* Rutas Privadas Protegidas con JWT y RBAC */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="zonas" element={<ZonasPage />} />
            <Route path="vendedores" element={<VendedoresPage />} />
            <Route path="sorteos" element={<SorteosPage />} />
            <Route path="riesgo" element={<CuadriculaRiesgoPage />} />
            <Route path="liquidacion" element={<LiquidacionPage />} />
            <Route path="auditoria" element={<PlaceholderPage title="Auditoría de Boletos y Reimpresiones (CU06)" milestone="Milestone 2" />} />
          </Route>
        </Route>

        {/* Fallback para rutas inexistentes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
