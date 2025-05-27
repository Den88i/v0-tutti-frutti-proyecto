export interface User {
  id: string
  email: string
  username: string
  full_name: string
  avatar_url?: string
  is_admin: boolean
  total_score: number
  games_played: number
  tournaments_won: number
  created_at: string
  updated_at: string
}

export interface Tournament {
  id: string
  name: string
  description?: string
  admin_id: string
  max_participants: number
  entry_fee: number
  prize_pool: number
  status: "draft" | "open" | "in_progress" | "completed" | "cancelled"
  start_date?: string
  end_date?: string
  rounds_total: number
  time_per_round: number
  categories: string[]
  rules?: string
  room_type: "basic" | "vip"
  entry_fee_basic: number
  entry_fee_vip: number
  total_collected: number
  admin_commission: number
  prize_pool_actual: number
  created_at: string
  updated_at: string
  participant_count?: number
  admin?: User
}

export interface TournamentParticipant {
  id: string
  tournament_id: string
  user_id: string
  registration_date: string
  status: "registered" | "confirmed" | "eliminated" | "winner"
  total_score: number
  position?: number
  payment_status: "pending" | "paid" | "refunded"
  payment_id?: string
  user?: User
}

export interface Game {
  id: string
  tournament_id: string
  round_number: number
  letter: string
  status: "waiting" | "in_progress" | "completed"
  start_time?: string
  end_time?: string
  duration_seconds: number
  created_at: string
}

export interface PlayerAnswer {
  id: string
  game_id: string
  user_id: string
  category: string
  answer?: string
  is_valid?: boolean
  points: number
  submitted_at: string
}

export interface Payment {
  id: string
  user_id: string
  tournament_id: string
  amount: number
  status: "pending" | "approved" | "rejected" | "cancelled"
  payment_method: string
  external_payment_id?: string
  payment_url?: string
  created_at: string
  paid_at?: string
}

export interface AdminEarnings {
  id: string
  tournament_id: string
  total_inscriptions: number
  commission_percentage: number
  commission_amount: number
  created_at: string
}
