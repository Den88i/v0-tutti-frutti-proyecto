"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import type { User } from "@/lib/types"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Settings, Users, Clock, Trophy, Crown, DollarSign } from "lucide-react"

const DEFAULT_CATEGORIES = ["Nombre", "Animal", "Cosa", "País", "Comida", "Profesión"]

export default function CreateTournament() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    max_participants: 8,
    rounds_total: 5,
    time_per_round: 60,
    categories: DEFAULT_CATEGORIES,
    rules: "",
    start_date: "",
    end_date: "",
    room_type: "basic" as "basic" | "vip",
  })
  const [customCategory, setCustomCategory] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [])

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
    }
  }

  const calculatePrizePool = () => {
    const entryFee = formData.room_type === "vip" ? 5000 : 2000
    const totalCollected = entryFee * formData.max_participants
    const adminCommission = totalCollected * 0.3 // 30% para admin
    const prizePool = totalCollected - adminCommission
    return { totalCollected, adminCommission, prizePool, entryFee }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { totalCollected, adminCommission, prizePool, entryFee } = calculatePrizePool()

      const { data, error } = await supabase
        .from("tournaments")
        .insert({
          name: formData.name,
          description: formData.description,
          admin_id: user!.id,
          max_participants: formData.max_participants,
          entry_fee: entryFee,
          prize_pool: prizePool,
          rounds_total: formData.rounds_total,
          time_per_round: formData.time_per_round,
          categories: formData.categories,
          rules: formData.rules,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          status: "draft",
          room_type: formData.room_type,
          entry_fee_basic: 2000,
          entry_fee_vip: 5000,
          total_collected: 0, // Se actualizará cuando se registren usuarios
          admin_commission: 0, // Se actualizará cuando se registren usuarios
          prize_pool_actual: 0, // Se actualizará cuando se registren usuarios
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/admin/tournaments/${data.id}`)
    } catch (error) {
      console.error("Error creating tournament:", error)
    } finally {
      setLoading(false)
    }
  }

  const addCustomCategory = () => {
    if (customCategory.trim() && !formData.categories.includes(customCategory.trim())) {
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, customCategory.trim()],
      }))
      setCustomCategory("")
    }
  }

  const removeCategory = (categoryToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat !== categoryToRemove),
    }))
  }

  const toggleDefaultCategory = (category: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, category],
      }))
    } else {
      removeCategory(category)
    }
  }

  const { totalCollected, adminCommission, prizePool, entryFee } = calculatePrizePool()

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-pink-900/10 to-cyan-900/10"></div>
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-black/80 border border-cyan-500/50 rounded-lg shadow-2xl shadow-cyan-500/25 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                CREAR TORNEO
              </h1>
              <p className="text-gray-300">Configura un nuevo torneo de Tutti Frutti</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-black/80 border-cyan-500/50 shadow-lg shadow-cyan-500/25 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-cyan-300 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">
                    Nombre del Torneo
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-900/50 border-cyan-500/50 text-white"
                    placeholder="Copa Tutti Frutti 2024"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_participants" className="text-white">
                    Máximo Participantes
                  </Label>
                  <Select
                    value={formData.max_participants.toString()}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, max_participants: Number.parseInt(value) }))
                    }
                  >
                    <SelectTrigger className="bg-gray-900/50 border-cyan-500/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 jugadores</SelectItem>
                      <SelectItem value="8">8 jugadores</SelectItem>
                      <SelectItem value="16">16 jugadores</SelectItem>
                      <SelectItem value="32">32 jugadores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="bg-gray-900/50 border-cyan-500/50 text-white"
                  placeholder="Descripción del torneo..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Room Type & Payment */}
          <Card className="bg-black/80 border-yellow-500/50 shadow-lg shadow-yellow-500/25 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-yellow-300 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Tipo de Sala y Pagos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-white text-lg">Selecciona el tipo de sala</Label>
                <RadioGroup
                  value={formData.room_type}
                  onValueChange={(value: "basic" | "vip") => setFormData((prev) => ({ ...prev, room_type: value }))}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-3 p-4 border border-cyan-500/50 rounded-lg hover:border-cyan-400 transition-colors">
                    <RadioGroupItem value="basic" id="basic" />
                    <div className="flex-1">
                      <Label htmlFor="basic" className="text-cyan-300 text-lg font-bold cursor-pointer">
                        💎 SALA BÁSICA
                      </Label>
                      <p className="text-gray-300 text-sm">Inscripción: $2,000 pesos</p>
                      <p className="text-gray-400 text-xs">Ideal para comenzar en los torneos</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border border-yellow-500/50 rounded-lg hover:border-yellow-400 transition-colors">
                    <RadioGroupItem value="vip" id="vip" />
                    <div className="flex-1">
                      <Label
                        htmlFor="vip"
                        className="text-yellow-300 text-lg font-bold cursor-pointer flex items-center gap-2"
                      >
                        <Crown className="h-5 w-5" />👑 SALA VIP
                      </Label>
                      <p className="text-gray-300 text-sm">Inscripción: $5,000 pesos</p>
                      <p className="text-gray-400 text-xs">Mayores premios y competencia de élite</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Prize Pool Calculator */}
              <div className="bg-gray-900/50 border border-green-500/50 rounded-lg p-4">
                <h3 className="text-green-300 font-bold mb-3 flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Calculadora de Premios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-400">Inscripción por jugador</p>
                    <p className="text-2xl font-bold text-white">${entryFee.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Total recaudado ({formData.max_participants} jugadores)</p>
                    <p className="text-2xl font-bold text-cyan-300">${totalCollected.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Pozo para ganadores</p>
                    <p className="text-2xl font-bold text-green-300">${prizePool.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Configuration */}
          <Card className="bg-black/80 border-pink-500/50 shadow-lg shadow-pink-500/25 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-pink-300 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Configuración del Juego
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rounds_total" className="text-white">
                    Número de Rondas
                  </Label>
                  <Input
                    id="rounds_total"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.rounds_total}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, rounds_total: Number.parseInt(e.target.value) }))
                    }
                    className="bg-gray-900/50 border-pink-500/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time_per_round" className="text-white">
                    Tiempo por Ronda (segundos)
                  </Label>
                  <Input
                    id="time_per_round"
                    type="number"
                    min="30"
                    max="300"
                    value={formData.time_per_round}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, time_per_round: Number.parseInt(e.target.value) }))
                    }
                    className="bg-gray-900/50 border-pink-500/50 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="bg-black/80 border-purple-500/50 shadow-lg shadow-purple-500/25 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-purple-300 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Categorías del Juego
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-white">Categorías Predeterminadas</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {DEFAULT_CATEGORIES.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={formData.categories.includes(category)}
                        onCheckedChange={(checked) => toggleDefaultCategory(category, checked as boolean)}
                      />
                      <Label htmlFor={category} className="text-gray-300">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-white">Agregar Categoría Personalizada</Label>
                <div className="flex gap-2">
                  <Input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="bg-gray-900/50 border-purple-500/50 text-white"
                    placeholder="Nueva categoría..."
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCategory())}
                  />
                  <Button type="button" onClick={addCustomCategory} className="bg-purple-500 hover:bg-purple-400">
                    Agregar
                  </Button>
                </div>
              </div>

              {formData.categories.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-white">Categorías Seleccionadas</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.categories.map((category) => (
                      <div
                        key={category}
                        className="bg-purple-500/20 border border-purple-500/50 rounded-lg px-3 py-1 flex items-center gap-2"
                      >
                        <span className="text-purple-300">{category}</span>
                        <button
                          type="button"
                          onClick={() => removeCategory(category)}
                          className="text-purple-300 hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rules and Dates */}
          <Card className="bg-black/80 border-orange-500/50 shadow-lg shadow-orange-500/25 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-orange-300 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Reglas y Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rules" className="text-white">
                  Reglas Especiales
                </Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rules: e.target.value }))}
                  className="bg-gray-900/50 border-orange-500/50 text-white"
                  placeholder="Reglas adicionales del torneo..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-white">
                    Fecha de Inicio (Opcional)
                  </Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                    className="bg-gray-900/50 border-orange-500/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-white">
                    Fecha de Fin (Opcional)
                  </Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                    className="bg-gray-900/50 border-orange-500/50 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name || formData.categories.length === 0}
              className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-black font-bold shadow-lg shadow-green-500/50"
            >
              {loading ? (
                "Creando..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Torneo
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
