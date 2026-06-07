import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

export type AuthState = {
  session: Session | null
  isLoading: boolean
  error: string | null
}

export const getCurrentSession = async (): Promise<Session | null> => {
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session
}

export const onAuthSessionChange = (
  onSessionChange: (session: Session | null) => void,
) => {
  if (!supabase) {
    return () => undefined
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onSessionChange(session)
  })

  return () => {
    data.subscription.unsubscribe()
  }
}

export const signInWithEmailPassword = async (
  email: string,
  password: string,
): Promise<Session | null> => {
  if (!supabase) {
    throw new Error('Supabase auth is not configured.')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data.session
}

export const signOut = async (): Promise<void> => {
  if (!supabase) {
    return
  }

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}
