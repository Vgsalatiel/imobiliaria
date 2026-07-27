import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { RequireAuth } from "./routes/RequireAuth";
import { RequireAdmin } from "./routes/RequireAdmin";
import { HomePage } from "./pages/public/HomePage";
import { PropertyDetailPage } from "./pages/public/PropertyDetailPage";
import { LoginPage } from "./pages/admin/LoginPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { PropertiesAdminPage } from "./pages/admin/PropertiesAdminPage";
import { NewPropertyPage } from "./pages/admin/NewPropertyPage";
import { VisitsPage } from "./pages/admin/VisitsPage";
import { CorretoresPage } from "./pages/admin/CorretoresPage";
import { NotFoundPage } from "./pages/public/NotFoundPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/imoveis/:id" element={<PropertyDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="/admin/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="imoveis" element={<PropertiesAdminPage />} />
              <Route path="imoveis/novo" element={<NewPropertyPage />} />
              <Route path="visitas" element={<VisitsPage />} />
              <Route element={<RequireAdmin />}>
                <Route path="corretores" element={<CorretoresPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
