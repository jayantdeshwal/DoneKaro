import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, UserRole } from '@kaamgar/shared'
import { getSupabaseClient } from '@/lib/supabase'
import { subscribeToPushNotifications } from '@/utils/pushNotification'

export interface PhoneAuthResult {
  user: User
  isNewUser: boolean
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (user: User) => void
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  verifyAndLoginWithOtp: (phone: string, accessToken: string, fullName?: string, email?: string) => Promise<PhoneAuthResult>
  updateEmail: (email: string) => Promise<void>
  isAuthenticated: boolean
  isWorker: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isSubAdmin: boolean
  needsPhoneVerification: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface ProfileRow {
  id: string
  full_name: string
  phone: string | null
  email?: string | null
  role: UserRole
  language: 'en' | 'hi'
  avatar_url: string | null
  address_proof_url?: string | null
  registration_completed?: boolean | null
  created_at: string | null
}

export const SUPER_ADMIN_UUID = '3216cdd3-aaea-45ab-944c-cfb30d6a6e0b'

let activeAuthLoadSequence = 0

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let subscription: { unsubscribe: () => void } | undefined

    const loadSession = async () => {
      try {
        if (import.meta.env.DEV) {
          const testSessionRaw = sessionStorage.getItem('donekaro_test_session')
          if (testSessionRaw) {
            try {
              const testUser: User = JSON.parse(testSessionRaw)
              if (testUser && testUser.id && isMounted) {
                setUser(testUser)
                setIsLoading(false)
                return
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        const supabase = getSupabaseClient()
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        if (data.session && isMounted) {
          await loadSupabaseUser(data.session.user)
        } else if (isMounted) {
          setUser(null)
        }

        const authState = supabase.auth.onAuthStateChange((_event, session) => {
          if (!isMounted) return
          if (!session) {
            setUser(null)
            return
          }
          void loadSupabaseUser(session.user)
        })
        subscription = authState.data.subscription
      } catch {
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadSession()

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const loadSupabaseUser = async (authUser: {
    id: string
    email?: string
    phone?: string
    user_metadata?: Record<string, unknown>
    created_at?: string
  }): Promise<User | null> => {
    const currentSeq = ++activeAuthLoadSequence
    const supabase = getSupabaseClient()
    let { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email, role, language, avatar_url, address_proof_url, registration_completed, created_at')
      .eq('id', authUser.id)
      .maybeSingle()

    // Graceful column fallback: If query fails because newly added schema columns (such as address_proof_url)
    // are not yet migrated to the remote database (Postgres error 42703), retry with the stable core columns.
    if (profileError && (profileError.code === '42703' || profileError.message?.includes('does not exist'))) {
      const fallbackQuery = await supabase
        .from('profiles')
        .select('id, full_name, phone, email, role, language, avatar_url, created_at')
        .eq('id', authUser.id)
        .maybeSingle()
      if (!fallbackQuery.error) {
        profileData = fallbackQuery.data as any
        profileError = null
      }
    }

    // Prevent stale async queries from older sessions or events overwriting state
    if (currentSeq !== activeAuthLoadSequence) {
      return null
    }

    if (profileError) {
      console.error('[AuthContext] Error loading user profile:', profileError)
      // Never silently downgrade an existing user or the designated super-admin on query error
      if (authUser.id === SUPER_ADMIN_UUID) {
        const fallbackSuperAdmin: User = {
          id: authUser.id,
          name: 'Jayant Deshwal (Super Admin)',
          phone: authUser.phone || '',
          email: 'jayant.deshwal.56@gmail.com',
          role: 'super_admin',
          language: 'en',
          avatar_url: null,
          address_proof_url: null,
          registration_completed: true,
          created_at: authUser.created_at || new Date().toISOString(),
        }
        setUser(fallbackSuperAdmin)
        return fallbackSuperAdmin
      }
      // If user is already set with same ID, retain their current role
      if (user && user.id === authUser.id) {
        return user
      }
      throw new Error(`Profile query failed: ${profileError.message}`)
    }

    // Successful query with no row = account deleted. Sign out immediately.
    // A query error (network/DB failure) is NOT treated as deletion — handled above.
    if (profileData === null) {
      console.warn('[AuthContext] Profile not found for authenticated user — account deleted. Signing out.')
      setUser(null)
      void supabase.auth.signOut()
      return null
    }

    const profile = profileData as ProfileRow

    // Authoritative role resolution:
    // 1. Authoritative Super Admin anchor
    let role: UserRole = profile.role
    if (authUser.id === SUPER_ADMIN_UUID) {
      role = 'super_admin'
    } else if (role !== 'worker' && role !== 'admin' && role !== 'super_admin' && role !== 'sub_admin') {
      const { data: workerCheck } = (await supabase
        .from('worker_profiles' as any)
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle()) as { data: { id: string } | null }
      if (workerCheck?.id) {
        role = 'worker'
      } else {
        role = role ?? 'customer'
      }
    }

    // Filter out internal synthetic email domains from personal email display
    const rawEmail = profile.email || authUser.email || ''
    const isSyntheticEmail =
      rawEmail.includes('@phone.donekaro.local') ||
      rawEmail.includes('@phone.kaamgar.local') ||
      rawEmail.includes('@phone.jugnu.in')
    const cleanEmail = isSyntheticEmail ? null : rawEmail || null

    const resolvedUser: User = {
      id: authUser.id,
      name:
        profile.full_name ||
        String(authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? authUser.email ?? 'User'),
      phone: profile.phone || authUser.phone || '',
      email: cleanEmail,
      role,
      language: profile.language ?? 'en',
      avatar_url: profile.avatar_url ?? (authUser.user_metadata?.avatar_url as string) ?? null,
      address_proof_url: profile.address_proof_url ?? null,
      registration_completed: profile.registration_completed ?? true,
      created_at: profile.created_at ?? authUser.created_at,
    }

    if (currentSeq === activeAuthLoadSequence) {
      setUser(resolvedUser)
      void subscribeToPushNotifications(resolvedUser.id).then(result => {
        if (!result.success && result.error) {
          console.warn('[AuthContext] Push notification subscription failed:', result.error)
        }
      })
      if (typeof window !== 'undefined') {
        if (!sessionStorage.getItem('donekaro_auth_session_event')) {
          sessionStorage.setItem('donekaro_auth_session_event', `auth_${Date.now()}`)
        }
      }
    }

    return resolvedUser
  }

  const login = (userData: User) => {
    setUser(userData)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('donekaro_auth_session_event', `auth_${Date.now()}`)
    }
  }

  const logout = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('donekaro_guest_mode')
      sessionStorage.removeItem('donekaro_auth_session_event')
      sessionStorage.removeItem('donekaro_safety_notice_dismissed')
      sessionStorage.removeItem('donekaro_test_session')
    }
    try {
      const supabase = getSupabaseClient()
      // Revoke server-side 2FA authorization before signing out
      try { await supabase.rpc('revoke_admin_2fa') } catch { /* non-admin sessions have no record */ }
      const { error } = await supabase.auth.signOut()
      if (error) console.warn('Supabase sign-out notice:', error.message)
    } catch (err) {
      console.warn('Sign out notice:', err)
    }
    setUser(null)
  }

  const signInWithGoogle = async (redirectTo?: string) => {
    const supabase = getSupabaseClient()
    const redirectUrl =
      redirectTo || (typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    })
    if (error) throw error
  }

  /**
   * Authoritative passwordless login / registration with MSG91 OTP token.
   * Invokes the server-side verify-phone-auth Edge Function, installs the legitimate Supabase session,
   * loads the authoritative database profile, and synchronizes React state.
   */
  const verifyAndLoginWithOtp = async (
    rawPhone: string,
    accessToken: string,
    fullName?: string,
    optionalEmail?: string
  ): Promise<PhoneAuthResult> => {
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10)
    const formattedPhone = `+91${cleanPhone}`
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.functions.invoke('verify-phone-auth', {
      body: {
        phone: formattedPhone,
        accessToken,
        fullName: fullName?.trim() || undefined,
        email: optionalEmail?.trim() || undefined,
      },
    })

    if (error || !data || !data.session) {
      let serverErrorMsg = data?.error
      if (!serverErrorMsg && error) {
        try {
          const errorBody = await (error as any).context?.json()
          if (errorBody?.error) {
            serverErrorMsg = errorBody.error
          } else if (errorBody?.message) {
            serverErrorMsg = errorBody.message
          }
        } catch {
          // Ignore context JSON parse errors
        }
      }
      const errorMsg =
        serverErrorMsg || error?.message || 'OTP verification failed on server. Please check and retry.'
      console.error('[verifyAndLoginWithOtp] Edge Function error:', { errorMsg, error, data })
      throw new Error(errorMsg)
    }

    // Install genuine Supabase GoTrue session
    const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

    if (sessionErr || !sessionData.user) {
      throw new Error(sessionErr?.message || 'Failed to install authenticated session. Please retry.')
    }

    // Load authoritative profile from database
    const authoritativeUser = await loadSupabaseUser(sessionData.user)

    const finalUser: User = authoritativeUser || {
      id: data.user.id,
      name: data.user.name || fullName || 'User',
      phone: data.user.phone || formattedPhone,
      email: data.user.email || (optionalEmail?.trim() ?? null),
      role: (data.role as UserRole) || 'customer',
      language: 'en',
      avatar_url: null,
      address_proof_url: data.user.address_proof_url ?? null,
      registration_completed: data.isNewUser ? false : (data.user.registration_completed ?? true),
      created_at: new Date().toISOString(),
    }

    return {
      user: finalUser,
      isNewUser: Boolean(data.isNewUser),
      role: finalUser.role,
    }
  }

  const updateEmail = async (rawEmail: string) => {
    const cleanEmail = rawEmail.trim()
    const supabase = getSupabaseClient()

    if (user) {
      const updated = { ...user, email: cleanEmail || null }
      setUser(updated)

      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session?.user) {
          await (supabase.from('profiles') as any)
            .update({ email: cleanEmail || null })
            .eq('id', sessionData.session.user.id)
        }
      } catch (err) {
        console.warn('Error persisting updated email:', err)
      }
    }
  }

  const needsPhoneVerification = !!user && (!user.phone || user.phone.trim() === '')

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updates }
      setUser(updated)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        updateUser,
        signInWithGoogle,
        verifyAndLoginWithOtp,
        updateEmail,
        isAuthenticated: !!user,
        isWorker: user?.role === 'worker',
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'sub_admin',
        isSuperAdmin: user?.role === 'super_admin',
        isSubAdmin: user?.role === 'sub_admin',
        needsPhoneVerification,
      }}
    >
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