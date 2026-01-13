/**
 * Authentication API Client
 *
 * Handles all authentication-related API calls (signup, signin, logout)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface SignupData {
  name: string
  email: string
  password: string
}

export interface SigninData {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user_id: number
  email: string
  name: string
}

class AuthClient {
  async signup(data: SignupData): Promise<void> {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      let errorDetail = 'Signup failed'
      try {
        const error = await response.json()
        errorDetail = error.detail || errorDetail
      } catch {}
      throw new Error(errorDetail)
    }
  }

  async signin(data: SigninData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      let errorDetail = 'Signin failed'
      try {
        const error = await response.json()
        errorDetail = error.detail || errorDetail
      } catch {}
      throw new Error(errorDetail)
    }

    return await response.json()
  }

  async logout(): Promise<void> {
    // Stateless logout - just clear local storage
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
  }
}

export const authClient = new AuthClient()
