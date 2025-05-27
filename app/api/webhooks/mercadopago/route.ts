import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getPaymentInfo } from "@/lib/mercadopago"
import crypto from 'crypto'; // Importa el módulo crypto para la validación de la firma

// Obtén el secreto de tus variables de entorno de Vercel
const MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

// Función para actualizar las estadísticas del torneo (la he dejado igual que la tuya)
async function updateTournamentStats(tournamentId: string) {
  try {
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*, tournament_participants(*)")
      .eq("id", tournamentId)
      .single()

    if (tournamentError) throw tournamentError

    const paidParticipants = tournament.tournament_participants.filter((p: any) => p.payment_status === "paid").length

    const entryFee = tournament.room_type === "vip" ? tournament.entry_fee_vip : tournament.entry_fee_basic
    const totalCollected = entryFee * paidParticipants
    const adminCommission = totalCollected * 0.3
    const prizePoolActual = totalCollected - adminCommission

    const { error: updateError } = await supabase
      .from("tournaments")
      .update({
        total_collected: totalCollected,
        admin_commission: adminCommission,
        prize_pool_actual: prizePoolActual,
      })
      .eq("id", tournamentId)

    if (updateError) throw updateError

    const { error: earningsError } = await supabase.from("admin_earnings").upsert({
      tournament_id: tournamentId,
      total_inscriptions: totalCollected,
      commission_percentage: 30,
      commission_amount: adminCommission,
    })

    if (earningsError) throw earningsError

    console.log(`Tournament stats updated for ${tournamentId}`)
  } catch (error) {
    console.error("Error updating tournament stats:", error)
  }
}


export async function POST(request: NextRequest) {
  try {
    // --- 1. Obtener el cuerpo RAW de la solicitud para la validación de la firma ---
    // Next.js 13/14 App Router, o Page Router con NextRequest, permite leer el body una vez.
    // Lo leemos como texto para la firma y luego lo parseamos a JSON.
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    console.log("Webhook received:", body);

    // --- 2. Validar la Firma (HMAC Signature) ---
    const receivedSignature = request.headers.get('x-signature') || ''; // O el nombre de header correcto de Mercado Pago (revisa su documentación)

    if (!MERCADOPAGO_WEBHOOK_SECRET) {
      console.error('Webhook: Mercado Pago Webhook Secret not configured.');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const hmac = crypto.createHmac('sha256', MERCADOPAGO_WEBHOOK_SECRET);
    hmac.update(rawBody); // Firmamos el cuerpo RAW de la solicitud
    const expectedSignature = hmac.digest('hex');

    if (receivedSignature !== expectedSignature) {
      console.error('Webhook: Invalid signature. Received:', receivedSignature, 'Expected:', expectedSignature);
      return NextResponse.json({ error: 'Unauthorized: Invalid signature' }, { status: 401 });
    }

    // --- 3. Procesar la notificación ---
    if (body.type === "payment") {
      const paymentId = body.data.id

      // Obtener información completa del pago desde Mercado Pago
      const paymentInfo = await getPaymentInfo(paymentId)
      console.log("Payment info from MP:", paymentInfo)

      if (!paymentInfo || !paymentInfo.id) {
          console.error("Webhook: Could not retrieve payment info from Mercado Pago for ID:", paymentId);
          return NextResponse.json({ error: "Could not retrieve payment info" }, { status: 500 });
      }

      // --- 4. Idempotencia: Verificar si el pago ya fue procesado ---
      // Buscamos un pago en nuestra DB con ese external_payment_id
      const { data: existingPayment, error: fetchPaymentError } = await supabase
        .from("payments")
        .select("status, external_payment_id")
        .eq("external_payment_id", paymentId)
        .single();
      
      // Si no hay error y el pago ya existe y está aprobado, simplemente respondemos 200 OK
      if (!fetchPaymentError && existingPayment && existingPayment.status === "approved") {
        console.log(`Payment ID ${paymentId} already approved and processed. Skipping duplicate notification.`);
        return NextResponse.json({ received: true }); 
      }
      // Manejar otros errores de Supabase al buscar el pago existente
      if (fetchPaymentError && fetchPaymentError.code !== 'PGRST116') { // PGRST116 es 'No rows found'
          console.error("Webhook: Error fetching existing payment for idempotency check:", fetchPaymentError);
          return NextResponse.json({ error: "Database error during idempotency check" }, { status: 500 });
      }
      
      // --- 5. Lógica de procesamiento según el estado del pago ---
      if (paymentInfo.status === "approved") {
        // Extraer información del external_reference (validar aquí si `split` falla)
        const externalRef = paymentInfo.external_reference;
        if (!externalRef || !externalRef.includes("_")) {
            console.error("Webhook: Invalid external_reference format:", externalRef);
            return NextResponse.json({ error: "Invalid external reference" }, { status: 400 });
        }
        const [tournamentId, userId] = externalRef.split("_");

        // Actualizar el pago en la base de datos (Supabase)
        const { error: paymentError } = await supabase
          .from("payments")
          .update({
            status: "approved",
            external_payment_id: paymentId,
            paid_at: new Date().toISOString(),
          })
          .eq("tournament_id", tournamentId)
          .eq("user_id", userId);

        if (paymentError) {
          console.error("Webhook: Error updating payment:", paymentError);
          return NextResponse.json({ error: "Error updating payment" }, { status: 500 });
        }

        // Actualizar el participante del torneo
        const { error: participantError } = await supabase
          .from("tournament_participants")
          .update({
            payment_status: "paid",
            status: "confirmed", // Asumo que "confirmed" significa que ya pagó y está en el torneo
          })
          .eq("tournament_id", tournamentId)
          .eq("user_id", userId);

        if (participantError) {
          console.error("Webhook: Error updating participant:", participantError);
          return NextResponse.json({ error: "Error updating participant" }, { status: 500 });
        }

        // Actualizar estadísticas del torneo (esta función maneja sus propios errores)
        await updateTournamentStats(tournamentId);

        console.log(`Payment approved for user ${userId} in tournament ${tournamentId}`);

      } else if (paymentInfo.status === "pending") {
          // Si el pago está pendiente, podrías actualizar el estado en tu DB
          console.log(`Payment ID ${paymentId} is pending. Updating status in DB.`);
          // (Opcional) Implementa lógica para actualizar el estado a 'pending' en tu tabla 'payments'
          // y/o 'tournament_participants' si no lo hiciste al crear la preferencia.
          // Esto es útil si quieres mostrar un estado "pendiente de pago" al usuario.
          // Necesitarías el external_reference aquí también.
      } else if (paymentInfo.status === "rejected" || paymentInfo.status === "cancelled") {
          // Si el pago es rechazado o cancelado
          console.log(`Payment ID ${paymentId} was rejected/cancelled. Updating status in DB.`);
          // (Opcional) Implementa lógica para actualizar el estado a 'rejected'/'cancelled'
          // y quizás liberar el cupo en el torneo.
      }
      // Puedes añadir más `else if` para otros estados como 'refunded', etc.
    }

    return NextResponse.json({ received: true }); // Siempre responder 200 OK si el webhook fue procesado correctamente
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Si hay un error general en el try/catch, responder 500 para indicar a MP que algo falló
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// El endpoint GET para testeo no necesita cambios, solo para verificar que la ruta existe.
export async function GET() {
  return NextResponse.json({ message: "Webhook endpoint is working" });
}
