import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-auth",
};

// CONFIGURATION
const ADMIN_EMAIL = "iqbalahmed88600@gmail.com";
const ADMIN_PASS = "kira2024";
const RAPIDAPI_KEY = "72a4fab20amsh9639b73f00486a2p14d42cj sn8ab8ac19c88a";
const RECEIVER_ACCOUNT = "nyx_shop@bkjr";
const MERCHANT_NAME = "KiraStore";
const BAKONG_CHECK_URL = "https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5";

const getSupabaseAdmin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// Helper: Verify Admin Header
const isAdmin = (req: Request) => {
  const auth = req.headers.get("x-admin-auth");
  if (!auth) return false;
  try {
    const [email, pass] = atob(auth).split(":");
    return email === ADMIN_EMAIL && pass === ADMIN_PASS;
  } catch {
    return false;
  }
};

// Helper: CRC16 for KHQR
function crc16(str: string): string {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;
    const supabase = getSupabaseAdmin();

    switch (action) {
      // ===== 1. CHECK GAME ID =====
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
          }),
          { headers: corsHeaders },
        );
      }

      // ===== 2. CREATE AUTO KHQR =====
      case "create_qr": {
        const { amount, orderId } = body;
        const account = `0006bakong01${String(RECEIVER_ACCOUNT.length).padStart(2, "0")}${RECEIVER_ACCOUNT}0203JTR`;
        const payload = `00020101021229${String(account.length).padStart(2, "0")}${account}52045999530384054${String(amount.toFixed(2)).length.padStart(2, "0")}${amount.toFixed(2)}5802KH59${String(MERCHANT_NAME.length).padStart(2, "0")}${MERCHANT_NAME}6010Phnom Penh62${String(`01${String(orderId.length).padStart(2, "0")}${orderId}`).length.padStart(2, "0")}01${String(orderId.length).padStart(2, "0")}${orderId}6304`;
        const qr = payload + crc16(payload);

        // We simulate MD5 by hashing the string or using orderId
        return new Response(JSON.stringify({ qr, status: "pending" }), { headers: corsHeaders });
      }

      // ===== 3. VERIFY PAYMENT (MD5 & 5 MINUTE AUTO) =====
      case "verify_payment": {
        const { md5, orderId } = body;
        const BAKONG_TOKEN = Deno.env.get("BAKONG_TOKEN");

        const res = await fetch(BAKONG_CHECK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${BAKONG_TOKEN}` },
          body: JSON.stringify({ md5 }),
        });
        const result = await res.json();

        if (result.responseCode === 0) {
          // AUTO SAVE TO DB
          await supabase
            .from("orders")
            .update({
              status: "completed",
              transaction_hash: result.data.hash,
              completed_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          return new Response(JSON.stringify({ paid: true, hash: result.data.hash }), { headers: corsHeaders });
        }
        return new Response(JSON.stringify({ paid: false }), { headers: corsHeaders });
      }

      // ===== 4. ADMIN SYSTEM (Save & Delete) =====
      case "admin_action": {
        if (!isAdmin(req)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        const { subAction, table, data, id } = body;

        if (subAction === "save") {
          const { error } = await supabase.from(table).upsert(data);
          if (error) throw error;
        } else if (subAction === "delete") {
          const { error } = await supabase.from(table).delete().eq("id", id);
          if (error) throw error;
        }

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      default:
        return new Response("Action missing", { status: 400, headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
