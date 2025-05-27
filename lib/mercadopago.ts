// lib/mercadopago.ts

// Asegúrate de que mercadopago esté instalado: npm install mercadopago
import MercadoPagoConfig, { Payment, Preference } from 'mercadopago'; // ¡Importante: asegúrate de importar 'Payment' aquí!

// --- Variables de Entorno ---
// Estas variables deben estar configuradas en Vercel (Panel de Control -> Settings -> Environment Variables)
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;
const MP_PUBLIC_KEY = process.env.MP_PUBLIC_KEY!; // Esta no se usa en este archivo para las APIs, pero está bien tenerla

// --- Inicialización del Cliente de Mercado Pago ---
// Esta instancia se usará para todas las operaciones con la API de Mercado Pago
const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

// --- Interfaces de Datos ---
export interface PaymentPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface PaymentData {
  tournament_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  amount: number;
  tournament_name: string;
  room_type: "basic" | "vip";
}

// --- FUNCIÓN 1: createPaymentPreference (Para generar la URL de pago) ---
export const createPaymentPreference = async (paymentData: PaymentData): Promise<PaymentPreference> => {
  // Determina la base URL (para producción en Vercel, será tu dominio)
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://v0-tutti-frutti-proyecto.vercel.app/";

  const preferencePayload = {
    items: [
      {
        title: `Inscripción ${paymentData.tournament_name} (${paymentData.room_type.toUpperCase()})`,
        description: `Torneo Tutti Frutti - Sala ${paymentData.room_type === "vip" ? "VIP" : "Básica"}`,
        quantity: 1,
        currency_id: "ARS",
        unit_price: paymentData.amount,
      },
    ],
    payer: {
      email: paymentData.user_email,
      name: paymentData.user_name,
    },
    external_reference: `${paymentData.tournament_id}_${paymentData.user_id}`,
    back_urls: {
      success: `${baseUrl}/payment/success`,
      failure: `${baseUrl}/payment/failure`,
      pending: `${baseUrl}/payment/pending`,
    },
    auto_return: "approved",
    // Esta es la URL de tu webhook donde Mercado Pago enviará las notificaciones
    notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    metadata: {
      tournament_id: paymentData.tournament_id,
      user_id: paymentData.user_id,
      room_type: paymentData.room_type,
    },
  };

  try {
    // Usa el SDK de Mercado Pago para crear la preferencia
    const preferencesInstance = new Preference(client);
    const data = await preferencesInstance.create({ body: preferencePayload });
    return data as PaymentPreference;
  } catch (error) {
    console.error("Error creating payment preference:", error);
    throw error;
  }
};

// --- FUNCIÓN 2: getPaymentInfo (LA FUNCIÓN QUE FALTABA Y CAUSA EL ERROR) ---
// Esta función es necesaria para consultar los detalles de un pago a Mercado Pago
// cuando recibes una notificación en tu webhook.
export const getPaymentInfo = async (paymentId: string): Promise<any> => {
  try {
    const paymentInstance = new Payment(client); // Usa la instancia 'Payment' del SDK
    const paymentDetails = await paymentInstance.get({ id: paymentId }); // Obtiene los detalles del pago

    return paymentDetails;
  } catch (error) {
    console.error(`Error fetching payment info for ID ${paymentId}:`, error);
    // Relanza el error para que la función que llama (tu webhook) pueda manejarlo
    throw new Error(`Failed to get payment info from Mercado Pago for ID ${paymentId}`);
  }
};
