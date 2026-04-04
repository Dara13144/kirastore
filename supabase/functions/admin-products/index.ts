import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-auth",
};

// ========== CONFIGURATION ==========
const ADMIN_EMAIL = "iqbalahmed88600@gmail.com";
const ADMIN_PASS = "kira2024";
const RAPIDAPI_KEY = "72a4fab20amsh9639b73f00486a2p14d42cj sn8ab8ac19c88a";
const RECEIVER_ACCOUNT = "nyx_shop@bkjr";
const MERCHANT_NAME = "KiraStore";
const BAKONG_CHECK_URL = "https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5";

// ========== HELPERS ==========
const getSupabase = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const verifyAdmin = (req: Request) => {
  const auth = req.headers.get("x-admin-auth");
  if (!auth) return false;
  try {
    const [email, pass] = atob(auth).split(":");
    return email === ADMIN_EMAIL && pass === ADMIN_PASS;
  } catch {
    return false;
  }
};

// Simple CRC16 for KHQR
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

// ========== MAIN HANDLER ==========
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;
    const supabase = getSupabase();

    switch (action) {
      // ---------------------------------------------------------
      // 1. GAME ID CHECKER (RapidAPI)
      // ---------------------------------------------------------
      case "check_id": {
        const { gameId, userId, zoneId } = body;
        const url = `https://id-game-checker.p.rapidapi.com/check?game=${gameId.includes("mlbb") ? "mobilelegends" : "freefire"}&id=${userId}${zoneId ? `&zoneId=${zoneId}` : ""}`;

        const res = await fetch(url, {
          headers: { "X-RapidAPI-Key": RAPIDAPI_KEY, "X-RapidAPI-Host": "id-game-checker.p.rapidapi.com" },
        });
        const data = await res.json();
        return new Response(
          JSON.stringify({
            found: !!(data.nickname || data.name),
            username: data.nickname || data.name || "Not Found",
            source: "api",
          }),
          { headers: corsHeaders },
        );
      }

      // ---------------------------------------------------------
      // 2. KHQR PAYMENT GENERATION
      // ---------------------------------------------------------
      case "create_qr": {
        const { amount, orderId } = body;
        // Basic KHQR String Construction
        const account = `0006bakong01${String(RECEIVER_ACCOUNT.length).padStart(2, "0")}${RECEIVER_ACCOUNT}0203JTR`;
        const payload = `00020101021229${String(account.length).padStart(2, "0")}${account}52045999530384054${String(amount.toFixed(2)).length.padStart(2, "0")}${amount.toFixed(2)}5802KH59${String(MERCHANT_NAME.length).padStart(2, "0")}${MERCHANT_NAME}6010Phnom Penh62${String(`01${String(orderId.length).padStart(2, "0")}${orderId}`).length.padStart(2, "0")}01${String(orderId.length).padStart(2, "0")}${orderId}6304`;
        const finalQR = payload + computeCRC16(payload);

        return new Response(JSON.stringify({ qr: finalQR, status: "pending" }), { headers: corsHeaders });
      }

      // ---------------------------------------------------------
      // 3. ADMIN PANEL (Protected)
      // ---------------------------------------------------------
      case "admin_update_game":
      case "admin_delete_package":
      case "admin_get_orders": {
        if (!verifyAdmin(req)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

        if (action === "admin_get_orders") {
          const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        }

        if (action === "admin_delete_package") {
          await supabase.from("game_packages").delete().eq("id", body.id);
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid Action" }), { status: 400, headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
