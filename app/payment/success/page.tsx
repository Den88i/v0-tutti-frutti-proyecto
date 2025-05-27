"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Trophy, ArrowRight } from "lucide-react"

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular verificación de pago
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const paymentId = searchParams.get("payment_id")
  const status = searchParams.get("status")

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-400 text-xl font-mono">Verificando pago...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-cyan-900/20 to-blue-900/20"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Card className="w-full max-w-md bg-black/80 border-green-500/50 shadow-2xl shadow-green-500/25 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50 animate-pulse">
            <CheckCircle className="h-10 w-10 text-black" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            ¡PAGO EXITOSO!
          </CardTitle>
          <div className="text-green-300 font-mono text-lg tracking-wider">✅ INSCRIPCIÓN CONFIRMADA ✅</div>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
            <p className="text-green-300 mb-2">Tu inscripción ha sido procesada exitosamente</p>
            <p className="text-gray-300 text-sm">
              Recibirás una confirmación por email y podrás ver el torneo en tu dashboard.
            </p>
            {paymentId && <p className="text-gray-400 text-xs mt-2">ID de pago: {paymentId}</p>}
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-black font-bold py-3 shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/75 transition-all duration-300"
            >
              <Trophy className="mr-2 h-5 w-5" />
              IR AL DASHBOARD
            </Button>
            <Button
              onClick={() => router.push("/tournaments")}
              variant="outline"
              className="w-full border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Ver Más Torneos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
