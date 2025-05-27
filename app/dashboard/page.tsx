"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { signOut } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import type { User, Tournament } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Trophy, Users, Calendar, Plus, LogOut, Crown, Zap, Play, Clock } from "lucide-react"

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadUserData()
    loadTournaments()
  }, [])

  const loadUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("No authenticated user found")
        router.push("/auth")
        return
      }

      console.log("Authenticated user ID:", user.id)

      const { data: userData, error } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()

      if (error) {
        console.error("Database error:", error)
        throw error
      }

      if (!userData) {
        console.log("No user profile found, redirecting to auth")
        router.push("/auth")
        return
      }

      console.log("User data loaded:", userData)
      setUser(userData)
    } catch (error) {
      console.error("Error loading user:", error)
      router.push("/auth")
    } finally {
      setLoading(false)
    }
  }

  const loadTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select(`
          *,
          admin:users!tournaments_admin_id_fkey(username, full_name),
          tournament_participants(count)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const tournamentsWithCount = data.map((tournament) => ({
        ...tournament,
        participant_count: tournament.tournament_participants?.[0]?.count || 0,
      }))

      setTournaments(tournamentsWithCount)
    } catch (error) {
      console.error("Error loading tournaments:", error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/auth")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-500/20 text-green-300 border-green-500/50"
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
      case "completed":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50"
      case "draft":
        return "bg-gray-500/20 text-gray-300 border-gray-500/50"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/50"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "ABIERTO"
      case "in_progress":
        return "EN CURSO"
      case "completed":
        return "FINALIZADO"
      case "draft":
        return "BORRADOR"
      default:
        return status.toUpperCase()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 text-xl font-mono animate-pulse">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-pink-900/10 to-cyan-900/10"></div>
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="bg-black/80 border border-cyan-500/50 rounded-lg shadow-2xl shadow-cyan-500/25 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  DASHBOARD
                </h1>
                <p className="text-gray-300">Bienvenido, {user?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user?.is_admin && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black border-0 flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  ADMIN
                </Badge>
              )}
              <Avatar className="h-10 w-10 border-2 border-cyan-400/50">
                <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-pink-500 text-black font-bold">
                  {user?.full_name[0]}
                </AvatarFallback>
              </Avatar>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-red-500/50 text-red-300 hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-black/80 border-cyan-500/50 shadow-lg shadow-cyan-500/25 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-cyan-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{user?.tournaments_won}</p>
                  <p className="text-cyan-300 text-sm">Torneos Ganados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/80 border-pink-500/50 shadow-lg shadow-pink-500/25 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Play className="h-8 w-8 text-pink-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{user?.games_played}</p>
                  <p className="text-pink-300 text-sm">Partidas Jugadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/80 border-purple-500/50 shadow-lg shadow-purple-500/25 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{user?.total_score}</p>
                  <p className="text-purple-300 text-sm">Puntos Totales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/80 border-yellow-500/50 shadow-lg shadow-yellow-500/25 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {tournaments.filter((t) => t.status === "open").length}
                  </p>
                  <p className="text-yellow-300 text-sm">Torneos Abiertos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          {user?.is_admin && (
            <Button
              onClick={() => router.push("/admin/tournaments/create")}
              className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-black font-bold shadow-lg shadow-green-500/50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Torneo
            </Button>
          )}
          <Button
            onClick={() => router.push("/tournaments")}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold shadow-lg shadow-purple-500/50"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Ver Torneos
          </Button>
        </div>

        {/* Tournaments List */}
        <Card className="bg-black/80 border-cyan-500/50 shadow-2xl shadow-cyan-500/25 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-cyan-300 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Torneos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tournaments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No hay torneos disponibles</div>
            ) : (
              <div className="space-y-4">
                {tournaments.slice(0, 5).map((tournament) => (
                  <div
                    key={tournament.id}
                    className="p-4 bg-gray-900/50 border border-gray-700/50 rounded-lg hover:border-cyan-400/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">{tournament.name}</h3>
                          <Badge className={getStatusColor(tournament.status)}>
                            {getStatusText(tournament.status)}
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{tournament.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {tournament.participant_count}/{tournament.max_participants}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {tournament.rounds_total} rondas
                          </span>
                          <span>Por: {tournament.admin?.full_name}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {tournament.status === "open" && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-black font-bold"
                          >
                            Unirse
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20"
                          onClick={() => router.push(`/tournaments/${tournament.id}`)}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
