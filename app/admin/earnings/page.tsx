"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import type { User, Tournament, AdminEarnings } from "@/lib/types"
import { useRouter } from "next/navigation"
import { ArrowLeft, DollarSign, TrendingUp, Trophy, Eye, EyeOff } from "lucide-react"

export default function AdminEarningsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [earnings, setEarnings] = useState<AdminEarnings[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    if (user?.is_admin) {
      loadTournaments()
      loadEarnings()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      const userData = await getCurrentUser()
      if (!userData || !userData.is_admin) {
        router.push("/dashboard")
        return
      }
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
          tournament_participants(count)
        `)
        .eq("admin_id", user!.id)
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

  const loadEarnings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_earnings")
        .select(`
          *,
          tournament:tournaments(name, room_type)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setEarnings(data || [])
    } catch (error) {
      console.error("Error loading earnings:", error)
    }
  }

  const calculatePotentialEarnings = (tournament: Tournament) => {
    const entryFee = tournament.room_type === "vip" ? tournament.entry_fee_vip : tournament.entry_fee_basic
    const totalPotential = entryFee * tournament.max_participants
    const adminCommission = totalPotential * 0.3
    const currentTotal = entryFee * tournament.participant_count
    const currentCommission = currentTotal * 0.3

    return {
      entryFee,
      totalPotential,
      adminCommission,
      currentTotal,
      currentCommission,
    }
  }

  const totalEarnings = earnings.reduce((sum, earning) => sum + earning.commission_amount, 0)
  const totalPotentialEarnings = tournaments.reduce((sum, tournament) => {
    const { adminCommission } = calculatePotentialEarnings(tournament)
    return sum + adminCommission
  }, 0)

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
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-black/80 border border-green-500/50 rounded-lg shadow-2xl shadow-green-500/25 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  PANEL DE GANANCIAS
                </h1>
                <p className="text-gray-300">Administración financiera de torneos</p>
              </div>
            </div>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              className="border-green-500/50 text-green-300 hover:bg-green-500/20"
            >
              {showDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showDetails ? "Ocultar" : "Mostrar"} Detalles
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-black/80 border-green-500/50 shadow-lg shadow-green-500/25 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">${totalEarnings.toLocaleString()}</p>
                  <p className="text-green-300 text-sm">Ganancias Realizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/80 border-yellow-500/50 shadow-lg shadow-yellow-500/25 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">${totalPotentialEarnings.toLocaleString()}</p>
                  <p className="text-yellow-300 text-sm">Potencial Máximo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/80 border-purple-500/50 shadow-lg shadow-purple-500/25 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{tournaments.length}</p>
                  <p className="text-purple-300 text-sm">Torneos Creados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tournaments Financial Overview */}
        <Card className="bg-black/80 border-cyan-500/50 shadow-2xl shadow-cyan-500/25 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-cyan-300 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumen Financiero por Torneo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tournaments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No has creado torneos aún</div>
            ) : (
              <div className="space-y-4">
                {tournaments.map((tournament) => {
                  const { entryFee, totalPotential, adminCommission, currentTotal, currentCommission } =
                    calculatePotentialEarnings(tournament)

                  return (
                    <div
                      key={tournament.id}
                      className="p-4 bg-gray-900/50 border border-gray-700/50 rounded-lg hover:border-cyan-400/50 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-white">{tournament.name}</h3>
                          <Badge
                            className={
                              tournament.room_type === "vip"
                                ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black border-0"
                                : "bg-gradient-to-r from-cyan-500 to-blue-500 text-black border-0"
                            }
                          >
                            {tournament.room_type === "vip" ? "VIP" : "BÁSICA"}
                          </Badge>
                          <Badge
                            className={
                              tournament.status === "open"
                                ? "bg-green-500/20 text-green-300 border-green-500/50"
                                : "bg-gray-500/20 text-gray-300 border-gray-500/50"
                            }
                          >
                            {tournament.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">
                            {tournament.participant_count}/{tournament.max_participants} inscritos
                          </p>
                        </div>
                      </div>

                      {showDetails && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center p-3 bg-blue-900/20 rounded-lg">
                            <p className="text-blue-300 font-bold">${entryFee.toLocaleString()}</p>
                            <p className="text-gray-400">Inscripción</p>
                          </div>
                          <div className="text-center p-3 bg-green-900/20 rounded-lg">
                            <p className="text-green-300 font-bold">${currentCommission.toLocaleString()}</p>
                            <p className="text-gray-400">Ganancia Actual</p>
                          </div>
                          <div className="text-center p-3 bg-yellow-900/20 rounded-lg">
                            <p className="text-yellow-300 font-bold">${adminCommission.toLocaleString()}</p>
                            <p className="text-gray-400">Ganancia Máxima</p>
                          </div>
                          <div className="text-center p-3 bg-purple-900/20 rounded-lg">
                            <p className="text-purple-300 font-bold">
                              ${(totalPotential - adminCommission).toLocaleString()}
                            </p>
                            <p className="text-gray-400">Pozo Jugadores</p>
                          </div>
                        </div>
                      )}

                      {!showDetails && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Ganancia actual:</span>
                          <span className="text-green-300 font-bold text-lg">
                            ${currentCommission.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note about commission */}
        <div className="mt-6 p-4 bg-gray-900/50 border border-orange-500/50 rounded-lg">
          <p className="text-orange-300 text-sm">
            <strong>Nota:</strong> Las comisiones del 30% se calculan automáticamente sobre las inscripciones. Los
            jugadores solo ven el pozo de premios (70% del total recaudado).
          </p>
        </div>
      </div>
    </div>
  )
}
