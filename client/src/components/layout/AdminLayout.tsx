import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PlusCircle,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./AdminLayout.css";

export function AdminLayout() {
  const { brokerName, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__brand-icon">
            <KeyRound size={17} strokeWidth={2.2} />
          </span>
          <div>
            Lar&amp;Chave
            <span className="admin-sidebar__tag">painel do corretor</span>
          </div>
        </div>
        <nav className="admin-sidebar__nav">
          <NavLink to="/admin" end>
            <LayoutDashboard size={18} strokeWidth={2.1} />
            Visão geral
          </NavLink>
          <NavLink to="/admin/imoveis" end>
            <ListChecks size={18} strokeWidth={2.1} />
            Imóveis
          </NavLink>
          <NavLink to="/admin/imoveis/novo">
            <PlusCircle size={18} strokeWidth={2.1} />
            Novo imóvel
          </NavLink>
          <NavLink to="/admin/visitas">
            <CalendarCheck size={18} strokeWidth={2.1} />
            Visitas agendadas
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin/corretores">
              <Users size={18} strokeWidth={2.1} />
              Corretores
            </NavLink>
          )}
        </nav>

        <button type="button" className="admin-sidebar__logout" onClick={handleLogout}>
          <LogOut size={17} strokeWidth={2.1} />
          Sair
        </button>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span>Olá, {brokerName || "corretor"}</span>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
