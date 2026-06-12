import { getCurrentUser } from "@/lib/auth";
import { jsonOk, serverError, unauthorized } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const type = searchParams.get("type");

    const supabase = getSupabaseAdmin();

    if (type === "settlement") {
      let query = supabase
        .from("settlements")
        .select(
          "*, debtor:users!settlements_debtor_id_fkey(id, username, display_name), creditor:users!settlements_creditor_id_fkey(id, username, display_name)",
        )
        .or(`debtor_id.eq.${user.id},creditor_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(100);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return jsonOk({ items: data, kind: "settlement" });
    }

    let roundQuery = supabase
      .from("rounds")
      .select(
        "*, room:rooms(id, name), winner:users!rounds_winner_id_fkey(id, username, display_name)",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (roomId) {
      roundQuery = roundQuery.eq("room_id", roomId);
    }

    const { data: rounds, error } = await roundQuery;
    if (error) throw new Error(error.message);

    return jsonOk({ items: rounds, kind: "round" });
  } catch (error) {
    return serverError(error);
  }
}
