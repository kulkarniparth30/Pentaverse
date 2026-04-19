import React, { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChange, signOut as supabaseSignOut } from '../../services/supabaseClient'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const subscription = onAuthStateChange((currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    try {
      await supabaseSignOut()
    } catch (error) {
      console.error('Error signing out:', error.message)
    }
  }

  const value = {
    user,
    loading,
    signOut: logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
