import { createClient } from "npm:@supabase/supabase-js@2.95.3";
import { importPKCS8, SignJWT } from "npm:jose@6.1.0";

type Delivery = { delivery_id: number; enquiry_id: string; device_token: string; lease_id: string };
type ServiceAccount = { project_id: string; client_email: string; private_key: string };

function required(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`MISSING_${name}`);
  return value;
}

async function accessToken(account: ServiceAccount) {
  const key = await importPKCS8(account.private_key, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/firebase.messaging" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(account.client_email).setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt().setExpirationTime("5m").sign(key);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`FCM_AUTH_${response.status}`);
  const data = await response.json();
  if (typeof data.access_token !== "string") throw new Error("INVALID_FCM_AUTH_RESPONSE");
  return data.access_token;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    if (request.headers.get("Authorization") !== `Bearer ${required("PUSH_DISPATCH_SECRET")}`) {
      return new Response("Unauthorized", { status: 401 });
    }
    const raw: unknown = JSON.parse(required("FIREBASE_SERVICE_ACCOUNT"));
    if (!raw || typeof raw !== "object" || !("project_id" in raw) || typeof raw.project_id !== "string"
      || !("client_email" in raw) || typeof raw.client_email !== "string"
      || !("private_key" in raw) || typeof raw.private_key !== "string") throw new Error("INVALID_FIREBASE_SERVICE_ACCOUNT");
    const account: ServiceAccount = { project_id: raw.project_id, client_email: raw.client_email, private_key: raw.private_key };
    const token = await accessToken(account);
    const db = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
    const { data, error } = await db.rpc("claim_push_deliveries");
    if (error) throw new Error(`PUSH_CLAIM_${error.code}`);
    const deliveries: Delivery[] = data ?? [];
    let sent = 0;
    let retry = 0;
    for (const delivery of deliveries) {
      let result: "sent" | "unregistered" | "retry" | "failed" = "retry";
      try {
        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`, {
          method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ message: {
            token: delivery.device_token,
            notification: { title: "NEXUS", body: "New enquiry received / Nouvelle demande" },
            data: { enquiry_id: delivery.enquiry_id },
            android: { priority: "high", ttl: "3600s", notification: {
              channel_id: "enquiries", tag: delivery.enquiry_id, visibility: "PRIVATE", icon: "ic_notification",
            } },
          } }),
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok) result = "sent";
        else {
          const body = await response.json();
          const unregistered = Array.isArray(body.error?.details) && body.error.details.some(
            (item: { errorCode?: string }) => item.errorCode === "UNREGISTERED",
          );
          result = unregistered ? "unregistered" : response.status === 429 || response.status >= 500 ? "retry" : "failed";
          console.error("NEXUS: Push provider rejected delivery.", { delivery: delivery.delivery_id, status: response.status, result });
        }
      } catch (error) {
        console.error("NEXUS: Push delivery transport failed.", { delivery: delivery.delivery_id, error: error instanceof Error ? error.name : "TransportError" });
      }
      const { error: finishError } = await db.rpc("finish_push_delivery", {
        delivery_id: delivery.delivery_id, delivery_lease: delivery.lease_id, result,
      });
      if (finishError) throw new Error(`PUSH_FINISH_${finishError.code}`);
      if (result === "sent") sent++;
      if (result === "retry") retry++;
    }
    return Response.json({ processed: deliveries.length, sent, retry });
  } catch (error) {
    console.error("NEXUS: Push dispatcher failed.", error instanceof Error ? error.message : "Unexpected error");
    return Response.json({ error: "PUSH_DISPATCH_FAILED" }, { status: 500 });
  }
});
