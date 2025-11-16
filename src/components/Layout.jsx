import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StockAlert from './StockAlert'
import './Layout.css'

function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="layout">
      {/* Header Fixo Mobile */}
      <header className="page-top-header">
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="header-title">
          <h2>Sistema de Finanças</h2>
        </div>
      </header>

      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <h1>Sistema de Finanças</h1>
            <span className="navbar-subtitle">Controle de vendas</span>
          </div>

          <nav className="navbar-nav">
            <Link
              to="/dashboard"
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/sales"
              className={`nav-link ${isActive('/sales') ? 'active' : ''}`}
            >
              Vendas
            </Link>
            <Link
              to="/products"
              className={`nav-link ${isActive('/products') ? 'active' : ''}`}
            >
              Produtos
            </Link>
            <Link
              to="/clients"
              className={`nav-link ${isActive('/clients') ? 'active' : ''}`}
            >
              Clientes
            </Link>
            {(user?.role === 'admin' || user?.role === 'vendedor') && (
              <>
                <Link
                  to="/materials"
                  className={`nav-link ${isActive('/materials') ? 'active' : ''}`}
                >
                  Materiais
                </Link>
                <Link
                  to="/material-purchases"
                  className={`nav-link ${isActive('/material-purchases') ? 'active' : ''}`}
                >
                  Entradas
                </Link>
                <Link
                  to="/material-withdrawals"
                  className={`nav-link ${isActive('/material-withdrawals') ? 'active' : ''}`}
                >
                  Saídas
                </Link>
                <Link
                  to="/material-consumption"
                  className={`nav-link ${isActive('/material-consumption') ? 'active' : ''}`}
                >
                  Consumo
                </Link>
                <Link
                  to="/productions"
                  className={`nav-link ${isActive('/productions') ? 'active' : ''}`}
                >
                  Produções
                </Link>
                <Link
                  to="/reports"
                  className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
                >
                  Relatórios
                </Link>
              </>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/users"
                className={`nav-link ${isActive('/users') ? 'active' : ''}`}
              >
                Usuários
              </Link>
            )}
          </nav>

          <div className="navbar-footer">
            <div className="navbar-user">
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role}</span>
              </div>
              <button onClick={logout} className="btn-logout">
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <span className="user-name">{user?.name}</span>
            <button className="mobile-menu-close" onClick={closeMobileMenu} aria-label="Fechar">
              ×
            </button>
          </div>
          <nav className="mobile-nav">
            <Link
              to="/dashboard"
              className={`mobile-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Dashboard
            </Link>
            <Link
              to="/sales"
              className={`mobile-nav-link ${isActive('/sales') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Vendas
            </Link>
            <Link
              to="/products"
              className={`mobile-nav-link ${isActive('/products') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Produtos
            </Link>
            <Link
              to="/clients"
              className={`mobile-nav-link ${isActive('/clients') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Clientes
            </Link>
            {(user?.role === 'admin' || user?.role === 'vendedor') && (
              <>
                <Link
                  to="/materials"
                  className={`mobile-nav-link ${isActive('/materials') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Materiais
                </Link>
                <Link
                  to="/material-purchases"
                  className={`mobile-nav-link ${isActive('/material-purchases') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Entradas
                </Link>
                <Link
                  to="/material-withdrawals"
                  className={`mobile-nav-link ${isActive('/material-withdrawals') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Saídas
                </Link>
                <Link
                  to="/material-consumption"
                  className={`mobile-nav-link ${isActive('/material-consumption') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Consumo
                </Link>
                <Link
                  to="/productions"
                  className={`mobile-nav-link ${isActive('/productions') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Produções
                </Link>
                <Link
                  to="/reports"
                  className={`mobile-nav-link ${isActive('/reports') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Relatórios
                </Link>
              </>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/users"
                className={`mobile-nav-link ${isActive('/users') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Usuários
              </Link>
            )}
            <button onClick={logout} className="mobile-logout-btn">
              Sair
            </button>
          </nav>
        </div>
      </nav>

      <div className="layout-content">
        <div className='main-container'>
          <main className="main-content">
            {(user?.role === 'admin' || user?.role === 'vendedor') && <StockAlert />}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout
