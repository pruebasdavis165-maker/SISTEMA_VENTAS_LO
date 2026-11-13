import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="zonas" element={<PlaceholderPage title="Gestión de Zonas y Parámetros (CU01)" milestone="Milestone 2" />} />
          <Route path="vendedores" element={<PlaceholderPage title="Gestión de Vendedores y Saldo (CU02)" milestone="Milestone 2" />} />
          <Route path="sorteos" element={<PlaceholderPage title="Programación de Sorteos (CU03)" milestone="Milestone 2" />} />
          <Route path="riesgo" element={<PlaceholderPage title="Cuadrícula 00-99 y Bloqueos de Riesgo (CU04)" milestone="Milestone 2" />} />
          <Route path="liquidacion" element={<PlaceholderPage title="Cierre y Liquidación de Sorteos (CU05)" milestone="Milestone 2" />} />
          <Route path="auditoria" element={<PlaceholderPage title="Auditoría de Boletos y Reimpresiones (CU06)" milestone="Milestone 2" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
