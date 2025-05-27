"use client"

import { supabase } from "./supabase"
import type { User } from "./types"

export const signUp = async (
  email: string,
  password: string,
  userData: {
    username: string
    full_name: string
  },
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  })

  if (error) throw error

  // Create user record in our users table
  if (data.user) {
    const { error: userError } = await supabase.from("users").insert({
      id: data.user.id,
      email: data.user.email!,
      username: userData.username,
      full_name: userData.full_name,
      is_admin: false,
    })

    if (userError) throw userError
  }

  return data
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async (): Promise<User | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData, error } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (error) throw error
  return userData
}
