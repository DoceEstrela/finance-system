import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const checkingRef = useRef(false)

  // useCallback para evitar recriação da função
  const checkAuth = useCallback(async () => {
    // Evitar múltiplas chamadas simultâneas
    if (checkingRef.current) {
      return
    }
    
    checkingRef.current = true
    
    // Verificar se há token no localStorage
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setLoading(false)
      checkingRef.current = false
      return
    }
    
    try {
      const response = await authService.getMe()
      if (response.data.success) {
        setUser(response.data.data.user)
      } else {
        setUser(null)
        localStorage.removeItem('token')
      }
    } catch (error) {
      // Se for 401, remover token inválido
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        setUser(null)
      } else if (error.response?.status !== 429) {
        // Não logar erro 429, mas outros erros podem ser logados
        console.error('Erro ao verificar autenticação:', error)
        setUser(null)
      }
    } finally {
      setLoading(false)
      checkingRef.current = false
    }
  }, [])

  useEffect(() => {
    // Verificar apenas uma vez na montagem do componente
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executar apenas uma vez na montagem

  const login = useCallback(async (email, password) => {
    try {
      const response = await authService.login(email, password)
      if (response.data.success) {
        setUser(response.data.data.user)
        if (response.data.data.token) {
          localStorage.setItem('token', response.data.data.token)
        }
        return { success: true, message: response.data.message }
      }
      return { success: false, message: 'Erro ao fazer login' }
    } catch (error) {
      // Re-lançar o erro para que a página de login possa tratar
      throw error
    }
  }, [])

  const register = useCallback(async (userData) => {
    try {
      const response = await authService.register(userData)
      if (response.data.success) {
        // Só definir user e token se email já estiver verificado
        // Normalmente no registro, email não estará verificado ainda
        if (response.data.data.user?.emailVerified && response.data.data.token) {
          setUser(response.data.data.user)
          localStorage.setItem('token', response.data.data.token)
        }
        return { 
          success: true, 
          message: response.data.message,
          data: response.data.data 
        }
      }
      return { success: false, message: 'Erro ao registrar' }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao registrar',
      }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setUser(null)
      localStorage.removeItem('token')
    }
  }, [])

  // useMemo para evitar recriação do objeto value
  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
  }), [user, loading, login, register, logout, checkAuth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
