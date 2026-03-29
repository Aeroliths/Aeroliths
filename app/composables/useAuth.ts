import { ref, computed } from 'vue'
import type { Ref } from 'vue'

interface User {
  id: string
  email: string
  username: string
  profilePicture?: string | null
  lastActiveAt: string
  deletionRequestedAt?: string | null
  role: {
    id: string
    name: string
  }
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  username: string
  password: string
}

const user: Ref<User | null> = ref(null)
const isLoading = ref(false)

export const useAuth = () => {
  const isAuthenticated = computed(() => !!user.value)

  // Initialize auth state from httpOnly cookie (server validates it)
  const initAuth = async () => {
    try {
      await fetchCurrentUser()
    } catch {
      // No valid session
    }
  }

  // Fetch current user from API (cookie sent automatically)
  const fetchCurrentUser = async () => {
    try {
      const response = await $fetch<{ data: User }>('/api/auth/me', {
        credentials: 'include',
      })
      user.value = response.data
    } catch (error) {
      console.error('Failed to fetch current user:', error)
      throw error
    }
  }

  // Login function
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    try {
      const response = await $fetch<{ data: { user: User } }>('/api/auth/login', {
        method: 'POST',
        body: credentials,
        credentials: 'include',
      })

      user.value = response.data.user

      return { success: true }
    } catch (error: any) {
      console.error('Login failed:', error)
      return {
        success: false,
        error: error.data?.message || error.message || 'Login failed',
        code: error.data?.statusMessage || null,
      }
    } finally {
      isLoading.value = false
    }
  }

  // Register function
  const register = async (data: RegisterData) => {
    isLoading.value = true
    try {
      await $fetch('/api/users', {
        method: 'POST',
        body: data
      })

      return { success: true, needsVerification: true, email: data.email }
    } catch (error: any) {
      console.error('Registration failed:', error)
      return {
        success: false,
        needsVerification: false,
        error: error.data?.message || error.message || 'Registration failed'
      }
    } finally {
      isLoading.value = false
    }
  }

  // Resend verification email
  const resendVerification = async (email: string) => {
    try {
      await $fetch('/api/auth/resend-verification', {
        method: 'POST',
        body: { email },
      })
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Failed to resend verification email',
      }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // Proceed even if the request fails
    }
    user.value = null
    navigateTo('/login')
  }

  // Check if user has a specific role
  const hasRole = (roleName: string) => {
    return user.value?.role?.name === roleName
  }

  return {
    user: computed(() => user.value),
    isAuthenticated,
    isLoading: computed(() => isLoading.value),
    initAuth,
    login,
    register,
    resendVerification,
    logout,
    hasRole
  }
}
