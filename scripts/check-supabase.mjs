import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const get = (key) => {
  const line = env.split("\n").find((l) => l.startsWith(`${key}=`));
  if (!line) return "";
  return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
};

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = get("SUPABASE_SERVICE_ROLE_KEY");
const tls = get("NODE_TLS_REJECT_UNAUTHORIZED");

console.log("NEXT_PUBLIC_SUPABASE_URL:", url ? `set (${url.length} chars)` : "MISSING");
console.log("SUPABASE_SERVICE_ROLE_KEY:", serviceKey ? `set (${serviceKey.length} chars, jwt=${serviceKey.startsWith("eyJ")})` : "MISSING");
console.log("NODE_TLS_REJECT_UNAUTHORIZED:", tls || "not set");

if (tls === "0") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

if (!url || !serviceKey) {
  console.log("\nFAIL: missing required env vars");
  process.exit(1);
}

async function fetchRetry(url, init, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, init);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
}

try {
  const res = await fetchRetry(`${url}/rest/v1/users?select=id&limit=1`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  const body = await res.text();
  console.log("\nGET /users status:", res.status);
  console.log("body:", body.slice(0, 200));
  if (!res.ok) process.exit(1);
} catch (error) {
  console.log("\nGET ERROR:", error.message);
  if (error.cause) console.log("cause:", error.cause.message ?? error.cause);
  process.exit(1);
}

try {
  const res = await fetchRetry(`${url}/rest/v1/users`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      username: `diag_${Date.now()}`,
      display_name: "Diag",
      password_hash: "test",
    }),
  });
  const body = await res.text();
  console.log("\nPOST /users status:", res.status);
  console.log("body:", body.slice(0, 300));
  if (!res.ok) process.exit(1);
  console.log("\nOK: Supabase read + write hoạt động");
} catch (error) {
  console.log("\nPOST ERROR:", error.message);
  if (error.cause) console.log("cause:", error.cause.message ?? error.cause);
  console.log("\nGợi ý: mạng công ty có thể chặn POST tới Supabase. Thử hotspot/VPN.");
  process.exit(1);
}
