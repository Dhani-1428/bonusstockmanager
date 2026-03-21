'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User, Shop } from './types'
import { 
  getCurrentUser, setCurrentUser, getUserByEmail, createUser, 
  getUsers, updateUser, createShop, getUserShops, getCurrentShop, 
  setCurrentShop, getShopById, createSubscription, createUserSubscription
} from './store'

interface AuthContextType {
  user: User | null
  currentShop: Shop | null
  shops: Shop[]
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string, shopName: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  switchShop: (shopId: string) => void
  addShop: (name: string, address: string, phone: string) => Shop
  refreshUser: () => void
  updateAccount: (data: { name?: string; email?: string; password?: string }) => { success: boolean; error?: string }
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentShopData, setCurrentShopData] = useState<Shop | null>(null)
  const [shops, setShops] = useState<Shop[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(() => {
    const storedUser = getCurrentUser()
    setUser(storedUser)
    if (storedUser) {
      const userShops = getUserShops(storedUser.id)
      setShops(userShops)
      
      const currentShopId = getCurrentShop()
      if (currentShopId) {
        const shop = getShopById(currentShopId)
        if (shop && storedUser.shopIds.includes(shop.id)) {
          setCurrentShopData(shop)
        } else if (userShops.length > 0) {
          setCurrentShopData(userShops[0])
          setCurrentShop(userShops[0].id)
        }
      } else if (userShops.length > 0) {
        setCurrentShopData(userShops[0])
        setCurrentShop(userShops[0].id)
      }
    }
  }, [])

  useEffect(() => {
    refreshUser()
    setIsLoading(false)
  }, [refreshUser])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const existingUser = getUserByEmail(email)
    if (!existingUser) {
      return { success: false, error: 'No account found with this email' }
    }
    if (existingUser.password !== password) {
      return { success: false, error: 'Incorrect password' }
    }
    
    setCurrentUser(existingUser)
    refreshUser()

    // Notify user by email about successful login.
    // Fail silently if email sending fails (don't block login UX).
    try {
      await fetch('/api/send-auth-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'login',
          email: existingUser.email,
          username: existingUser.email,
          name: existingUser.name,
          loginTime: new Date().toISOString(),
        }),
      })
    } catch (err) {
      console.error('Failed to send login email:', err)
    }

    return { success: true }
  }

  const signup = async (
    name: string, 
    email: string, 
    password: string, 
    shopName: string
  ): Promise<{ success: boolean; error?: string }> => {
    const existingUser = getUserByEmail(email)
    if (existingUser) {
      return { success: false, error: 'An account with this email already exists' }
    }

    const newUser = createUser({
      name,
      email,
      password,
      role: 'admin',
      shopIds: [],
    })

    const newShop = createShop({
      name: shopName,
      address: '',
      phone: '',
      ownerId: newUser.id,
    })

    // Update user with shop ID
    updateUser(newUser.id, { shopIds: [newShop.id] })

    // Start free trial for new users
    try {
      // Create a default single shop subscription for trial
      const trialSubscription = createSubscription({
        name: 'Free Trial - Single Shop',
        price: 0,
        billingCycle: 'monthly',
        shopType: 'single',
        features: ['All Features', '15 Days Free'],
        maxShops: 1,
        maxProducts: 999999,
        maxUsers: 999,
        isActive: true,
      })
      
      createUserSubscription(newUser.id, trialSubscription.id, true)
    } catch (error) {
      console.error('Failed to start free trial:', error)
    }

    setCurrentUser({ ...newUser, shopIds: [newShop.id] })
    setCurrentShop(newShop.id)
    refreshUser()

    // Send credentials to the user's email on signup (username=email).
    // Fail silently if email sending fails.
    try {
      await fetch('/api/send-auth-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'signup',
          email: newUser.email,
          username: newUser.email,
          name: newUser.name,
          password,
        }),
      })
    } catch (err) {
      console.error('Failed to send signup email:', err)
    }
    
    return { success: true }
  }

  const logout = () => {
    setCurrentUser(null)
    setCurrentShop(null)
    setUser(null)
    setCurrentShopData(null)
    setShops([])
  }

  const switchShop = (shopId: string) => {
    if (!user) return

    // Re-check access from storage to avoid stale in-memory shopIds.
    const userShops = getUserShops(user.id)
    const hasAccess = userShops.some(s => s.id === shopId)
    const shop = getShopById(shopId)

    if (shop && hasAccess) {
      setCurrentShop(shopId)
      setCurrentShopData(shop)
      setShops(userShops)
      setUser(prev => (prev ? { ...prev, shopIds: userShops.map(s => s.id) } : prev))
    }
  }

  const addShop = (name: string, address: string, phone: string): Shop => {
    if (!user) throw new Error('Must be logged in to add a shop')
    
    const newShop = createShop({
      name,
      address,
      phone,
      ownerId: user.id,
    })
    
    refreshUser()
    return newShop
  }

  const updateAccount = (data: { name?: string; email?: string; password?: string }): { success: boolean; error?: string } => {
    if (!user) return { success: false, error: 'Not logged in' }
    if (user.role !== 'admin') return { success: false, error: 'Only admins can update account information' }
    
    // Check if email is being changed and if it already exists
    if (data.email && data.email !== user.email) {
      const existingUser = getUserByEmail(data.email)
      if (existingUser) {
        return { success: false, error: 'An account with this email already exists' }
      }
    }
    
    updateUser(user.id, data)
    setCurrentUser({ ...user, ...data })
    refreshUser()
    return { success: true }
  }

  return (
    <AuthContext.Provider value={{
      user,
      currentShop: currentShopData,
      shops,
      isLoading,
      login,
      signup,
      logout,
      switchShop,
      addShop,
      refreshUser,
      updateAccount,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
