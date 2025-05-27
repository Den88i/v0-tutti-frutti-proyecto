"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import type { User, Tournament } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Trophy, Users, Clock, Crown, DollarSign, Calendar, ArrowLeft } from "lucide-react"

export default function TournamentsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadUserData()
    loadTournaments()
  }, [])

  const loadUserData = async () => {
    try {
      const userData = await getCurrentUser()
      if (!userData) {
        router.push("/auth")
        return
      }
      setUser(userData)
    } catch (error) {
      console.error("Error loading user:", error)
      router.push("/auth")
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
        .in("status", ["open", "draft"])
        .order("created_at", { ascending: false })

      if (error) throw error

      const tournamentsWithCount = data.map((tournament) => ({
        ...tournament,
        participant_count: tournament.tournament_participants?.[0]?.count || 0,
      }))

      setTournaments(tournamentsWithCount)
    } catch (error) {
      console.error("Error loading tournaments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinTournament = async (tournament: Tournament) => {
    if (!user) return

    try {
      setPaymentLoading(true)
      const entryFee = tournament.room_type === "vip" ? tournament.entry_fee_vip : tournament.entry_fee_basic

      // Crear preferencia de pago en Mercado Pago
      const { createPaymentPreference } = await import("@/lib/mercadopago")

      const paymentData = {
        tournament_id: tournament.id,
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
        amount: entryFee,
        tournament_name: tournament.name,
        room_type: tournament.room_type,
      }

      const preference = await createPaymentPreference(paymentData)

      // Crear registro de pago pendiente
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          tournament_id: tournament.id,
          amount: entryFee,
          status: "pending",
          payment_method: "mercadopago",
          external_payment_id: preference.id,
          payment_url: preference.init_point,
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // Crear participante con estado pendiente
      const { error: participantError } = await supabase.from("tournament_participants").insert({
        tournament_id: tournament.id,
        user_id: user.id,
        status: "registered",
        payment_status: "pending",
        payment_id: payment.id,
      })

      if (participantError) throw participantError

      // Redirigir a Mercado Pago
      window.location.href = preference.init_point
    } catch (error) {
      console.error("Error joining tournament:", error)
      alert("Error al crear el pago. Inténtalo de nuevo.")
    } finally {
      setPaymentLoading(false)
    }
  }

  const getRoomTypeDisplay = (roomType: string) => {
    return roomType === "vip" ? (
      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black border-0 flex items-center gap-1">
        <Crown className="h-3 w-3" />
        VIP
      </Badge>
    ) : (
      <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black border-0">BÁSICA</Badge>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-500/20 text-green-300 border-green-500/50"
      case "draft":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/50"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 text-xl font-mono animate-pulse">Cargando torneos...</div>
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

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-black/80 border border-cyan-500/50 rounded-lg shadow-2xl shadow-cyan-500/25 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                TORNEOS DISPONIBLES
              </h1>
              <p className="text-gray-300">Únete a la competencia y gana increíbles premios</p>
            </div>
          </div>
        </div>

        {/* Tournaments Grid */}
        {tournaments.length === 0 ? (
          <Card className="bg-black/80 border-gray-500/50 shadow-lg backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-300 mb-2">No hay torneos disponibles</h3>
              <p className="text-gray-400">Los torneos aparecerán aquí cuando estén abiertos para inscripciones.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => {
              const entryFee = tournament.room_type === "vip" ? tournament.entry_fee_vip : tournament.entry_fee_basic
              const maxPrizePool = entryFee * tournament.max_participants * 0.7 // 70% del total recaudado

              return (
                <Card
                  key={tournament.id}
                  className={`bg-black/80 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                    tournament.room_type === "vip"
                      ? "border-yellow-500/50 shadow-yellow-500/25 hover:shadow-yellow-500/50"
                      : "border-cyan-500/50 shadow-cyan-500/25 hover:shadow-cyan-500/50"
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg mb-2">{tournament.name}</CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          {getRoomTypeDisplay(tournament.room_type)}
                          <Badge className={getStatusColor(tournament.status)}>
                            {tournament.status === "open" ? "ABIERTO" : "BORRADOR"}
                          </Badge>
                        </div>
                      </div>
                      {tournament.room_type === "vip" && <Crown className="h-6 w-6 text-yellow-400 animate-pulse" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm">{tournament.description}</p>

                    {/* Tournament Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="h-4 w-4" />
                        <span>
                          {tournament.participant_count}/{tournament.max_participants}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="h-4 w-4" />
                        <span>{tournament.rounds_total} rondas</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="h-4 w-4" />
                        <span>{tournament.time_per_round}s/ronda</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Trophy className="h-4 w-4" />
                        <span>{tournament.categories.length} categorías</span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-gray-900/50 border border-green-500/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-300 font-bold flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Inscripción
                        </span>
                        <span className="text-2xl font-bold text-white">${entryFee.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-300 text-sm">Pozo máximo</span>
                        <span className="text-yellow-300 font-bold">${maxPrizePool.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Admin Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gray-600 text-white text-xs">
                          {tournament.admin?.full_name?.[0] || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <span>Organizado por {tournament.admin?.full_name}</span>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleJoinTournament(tournament)}
                      disabled={
                        tournament.status !== "open" ||
                        tournament.participant_count >= tournament.max_participants ||
                        paymentLoading
                      }
                      className={`w-full font-bold shadow-lg transition-all duration-300 ${
                        tournament.room_type === "vip"
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-yellow-500/50"
                          : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black shadow-cyan-500/50"
                      }`}
                    >
                      {paymentLoading
                        ? "Procesando..."
                        : tournament.status !== "open"
                          ? "No Disponible"
                          : tournament.participant_count >= tournament.max_participants
                            ? "Torneo Lleno"
                            : `Inscribirse - $${entryFee.toLocaleString()}`}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
