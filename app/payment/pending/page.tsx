"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, ArrowLeft, Eye } from "lucide-react"

export default function PaymentPending() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const paymentId = searchParams.get("payment_id")

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-orange-900/20 to-amber-900/20"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Card className="w-full max-w-md bg-black/80 border-yellow-500/50 shadow-2xl shadow-yellow-500/25 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50 animate-pulse">
            <Clock className="h-10 w-10 text-black" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            PAGO PENDIENTE
          </CardTitle>
          <div className="text-yellow-300 font-mono text-lg tracking-wider">⏳ PROCESANDO PAGO ⏳</div>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
            <p className="text-yellow-300 mb-2">Tu pago está siendo procesado</p>
            <p className="text-gray-300 text-sm">
              Esto puede tomar unos minutos. Te notificaremos cuando se confirme tu inscripción.
            </p>
            {paymentId && <p className="text-gray-400 text-xs mt-2">ID de pago: {paymentId}</p>}
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold py-3 shadow-lg shadow-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/75 transition-all duration-300"
            >
              <Eye className="mr-2 h-5 w-5" />
              VER ESTADO EN DASHBOARD
            </Button>
            <Button
              onClick={() => router.push("/tournaments")}
              variant="outline"
              className="w-full border-amber-500/50 text-amber-300 hover:bg-amber-500/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Torneos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
