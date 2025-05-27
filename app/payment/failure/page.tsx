"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"

export default function PaymentFailure() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const paymentId = searchParams.get("payment_id")
  const status = searchParams.get("status")

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-orange-900/20 to-yellow-900/20"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Card className="w-full max-w-md bg-black/80 border-red-500/50 shadow-2xl shadow-red-500/25 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-red-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
            <XCircle className="h-10 w-10 text-black" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            PAGO FALLIDO
          </CardTitle>
          <div className="text-red-300 font-mono text-lg tracking-wider">❌ INSCRIPCIÓN NO COMPLETADA ❌</div>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-300 mb-2">No se pudo procesar tu pago</p>
            <p className="text-gray-300 text-sm">
              Esto puede deberse a fondos insuficientes, problemas con la tarjeta o una cancelación manual.
            </p>
            {paymentId && <p className="text-gray-400 text-xs mt-2">ID de pago: {paymentId}</p>}
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/tournaments")}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-black font-bold py-3 shadow-lg shadow-orange-500/50 hover:shadow-xl hover:shadow-orange-500/75 transition-all duration-300"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              INTENTAR DE NUEVO
            </Button>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="w-full border-gray-500/50 text-gray-300 hover:bg-gray-500/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
