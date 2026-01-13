import { useState, useEffect } from 'react'

interface AuthUser {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  userId: number | null
  userName: string | null
  userEmail: string | null
  user: { id: number; name: string; email: string } | null
  login: (token: string, userId: number, name: string, email: string) => void
  logout: () => void
}

export function useAuth(): AuthUser {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUserId = localStorage.getItem('userId')
    const storedUserName = localStorage.getItem('userName')
    const storedUserEmail = localStorage.getItem('userEmail')

    if (storedToken && storedUserId) {
      setToken(storedToken)
      setUserId(parseInt(storedUserId))
      setUserName(storedUserName)
      setUserEmail(storedUserEmail)
      setIsAuthenticated(true)
    } else {
      // No stored credentials - user is not authenticated
      setIsAuthenticated(false)
      setToken(null)
      setUserId(null)
      setUserName(null)
      setUserEmail(null)
    }
    // Auth check complete
    setIsLoading(false)
  }, [])

  const login = (token: string, userId: number, name: string, email: string) => {
    localStorage.setItem('token', token)
    localStorage.setItem('userId', userId.toString())
    localStorage.setItem('userName', name)
    localStorage.setItem('userEmail', email)

    setToken(token)
    setUserId(userId)
    setUserName(name)
    setUserEmail(email)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')

    setToken(null)
    setUserId(null)
    setUserName(null)
    setUserEmail(null)
    setIsAuthenticated(false)
  }

  return {
    isAuthenticated,
    isLoading,
    token,
    userId,
    userName,
    userEmail,
    user: userId ? { id: userId, name: userName || '', email: userEmail || '' } : null,
    login,
    logout,
  }
}
