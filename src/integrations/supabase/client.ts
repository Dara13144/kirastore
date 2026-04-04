import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-auth",
};

// ========== CONFIGURATION (Hardcoded for your request) ==========
const ADMIN_EMAIL = "iqbalahmed88600@gmail.com";
const ADMIN_PASS = "kira2024";
const RAPIDAPI_KEY = "72a4fab20amsh9639b73f00486a2p14d42cj sn8ab8ac19c88a";
const RECEIVER_ACCOUNT = "nyx_shop@bkjr";
const MERCHANT_NAME = "KiraStore";
const BAKONG_API = "https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5";

// ========== HELPER FUNCTIONS ==========
const getSupabaseAdmin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const verifyAdmin = (req: Request) => {
  const auth = req.headers.get("x-admin-auth");
  if (!auth) return false;
  try {
    const decoded = atob(auth);
    const [email, pass] = decoded.split(":");
    return email === ADMIN_EMAIL && pass === ADMIN_PASS;
  } catch {
    return false;
  }
};

function computeCRC16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// ========== MAIN SERVER ==========
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;
    const supabase = getSupabaseAdmin();

    switch (action) {
      // ---------------------------------------------------------
      // 1. GAME ID CHECKER (Working All Games)
      // ---------------------------------------------------------
      case "check_id": {
        const { gameId, userId, zoneId } = body;
        const provider = gameId.includes("mlbb") ? "mobilelegends" : "freefire";
        const url = `https://id-game-checker.p.rapidapi.com/check?game=${provider}&id=${userId}${zoneId ? `&zoneId=${zoneId}` : ""}`;

        const res = await fetch(url, {
          headers: { "X-RapidAPI-Key": RAPIDAPI_KEY, "X-RapidAPI-Host": "id-game-checker.p.rapidapi.com" },
        });
        const data = await res.json();
        return new Response(
          JSON.stringify({
            found: !!(data.nickname || data.name),
            username: data.nickname || data.name || "User Not Found",
            level: data.level || null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // ---------------------------------------------------------
      // 2. BAKONG PAYMENT (Automatic QR & Verify)
      // ---------------------------------------------------------
      case "create_qr": {
        const { amount, orderId } = body;
        const accountPart = `0006bakong01${String(RECEIVER_ACCOUNT.length).padStart(2, "0")}${RECEIVER_ACCOUNT}0203JTR`;
        const payload = `00020101021229${String(accountPart.length).padStart(2, "0")}${accountPart}52045999530384054${String(amount.toFixed(2)).length.padStart(2, "0")}${amount.toFixed(2)}5802KH59${String(MERCHANT_NAME.length).padStart(2, "0")}${MERCHANT_NAME}6010Phnom Penh62${String(`01${String(orderId.length).padStart(2, "0")}${orderId}`).length.padStart(2, "0")}01${String(orderId.length).padStart(2, "0")}${orderId}6304`;
        const qr = payload + computeCRC16(payload);
        return new Response(JSON.stringify({ qr, status: "pending" }), { headers: corsHeaders });
      }

      case "verify_payment": {
        const { md5, orderId } = body;
        const res = await fetch(BAKONG_API, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("BAKONG_TOKEN")}` },
          body: JSON.stringify({ md5 }),
        });
        const result = await res.json();
        if (result.responseCode === 0) {
          await supabase
            .from("orders")
            .update({ status: "completed", transaction_hash: result.data.hash })
            .eq("id", orderId);
          return new Response(JSON.stringify({ paid: true, hash: result.data.hash }), { headers: corsHeaders });
        }
        return new Response(JSON.stringify({ paid: false }), { headers: corsHeaders });
      }

      // ---------------------------------------------------------
      // 3. ADMIN PANEL (Full Save & Delete System)
      // ---------------------------------------------------------
      case "admin_save_game": {
        if (!verifyAdmin(req)) throw new Error("Unauthorized");
        const { id, ...data } = body.data;
        const { error } = await supabase.from("games").upsert({ id, ...data });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "admin_delete_game": {
        if (!verifyAdmin(req)) throw new Error("Unauthorized");
        await supabase.from("game_packages").delete().eq("game_id", body.id);
        const { error } = await supabase.from("games").delete().eq("id", body.id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "admin_get_all_orders": {
        if (!verifyAdmin(req)) throw new Error("Unauthorized");
        const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      default:
        return new Response(JSON.stringify({ error: "Action not found" }), { status: 400, headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
