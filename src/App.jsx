import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import SetupAdmin from './pages/SetupAdmin'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Clients from './pages/Clients'
import Sales from './pages/Sales'
import Reports from './pages/Reports'
import Materials from './pages/Materials'
import MaterialPurchases from './pages/MaterialPurchases'
import MaterialWithdrawals from './pages/MaterialWithdrawals'
import MaterialConsumption from './pages/MaterialConsumption'
import Productions from './pages/Productions'
import Users from './pages/Users'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/setup-admin" element={<PublicRoute><SetupAdmin /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password/:resetToken" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path="/verify-email/:verificationToken" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
      
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="clients" element={<Clients />} />
        <Route path="sales" element={<Sales />} />
        <Route path="reports" element={<Reports />} />
        <Route path="materials" element={<Materials />} />
        <Route path="material-purchases" element={<MaterialPurchases />} />
        <Route path="material-withdrawals" element={<MaterialWithdrawals />} />
        <Route path="material-consumption" element={<MaterialConsumption />} />
        <Route path="productions" element={<Productions />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  )
}

export default App
