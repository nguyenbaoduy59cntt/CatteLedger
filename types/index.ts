export type RoundType = "NORMAL" | "BURN" | "PENALTY";
export type SettlementStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export interface User {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
}

export interface UserPublic {
  id: string;
  username: string;
  display_name: string;
}

export interface Room {
  id: string;
  name: string;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  is_active: boolean;
  joined_at: string;
  left_at: string | null;
  user?: UserPublic;
}

export interface RoomWithDetails extends Room {
  owner?: UserPublic;
  active_members?: RoomMember[];
  active_member_count?: number;
  is_owner?: boolean;
  is_member?: boolean;
}

export interface PlayerSnapshot {
  id: string;
  displayName: string;
}

export interface Round {
  id: string;
  room_id: string;
  created_by: string;
  winner_id: string;
  round_type: RoundType;
  penalty_payer_id: string | null;
  player_snapshot: PlayerSnapshot[];
  amount_per_loser: number;
  loser_count: number;
  total_amount: number;
  is_rolled_back: boolean;
  rolled_back_at: string | null;
  rolled_back_by: string | null;
  created_at: string;
  winner?: UserPublic;
  penalty_payer?: UserPublic;
}

export interface UserBalance {
  id: string;
  debtor_id: string;
  creditor_id: string;
  amount: number;
  updated_at: string;
  debtor?: UserPublic;
  creditor?: UserPublic;
}

export interface BalanceSummary {
  i_owe: UserBalance[];
  owed_to_me: UserBalance[];
  total_i_owe: number;
  total_owed_to_me: number;
}

export interface Settlement {
  id: string;
  debtor_id: string;
  creditor_id: string;
  amount: number;
  status: SettlementStatus;
  requested_by: string;
  confirmed_by: string | null;
  rejected_by: string | null;
  confirmed_at: string | null;
  rejected_at: string | null;
  created_at: string;
  debtor?: UserPublic;
  creditor?: UserPublic;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface SubmitRoundInput {
  roomId: string;
  winnerId: string;
  type: RoundType;
  penaltyPayerId?: string;
}

export interface RoundPreview {
  type: RoundType;
  winner: UserPublic;
  penaltyPayer?: UserPublic;
  transactions: { debtor: UserPublic; creditor: UserPublic; amount: number }[];
}
