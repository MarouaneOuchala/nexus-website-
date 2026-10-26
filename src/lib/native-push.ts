import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { getEnquiryClient } from "@/lib/enquiries";

let pendingRegistration: Promise<boolean> = Promise.resolve(false);
let revision = 0;
let acceptingRegistrations = false;

export const isAndroidApp = () => Capacitor.getPlatform() === "android";

export function prepareNativePush() {
  acceptingRegistrations = true;
}

export function registerNativePush(token: string) {
  const attempt = revision;
  pendingRegistration = pendingRegistration.catch((error: unknown) => {
    console.error("NEXUS: Previous push registration failed.", error instanceof Error ? error.message : "Database error");
    return false;
  }).then(async () => {
    if (attempt !== revision || !acceptingRegistrations) return false;
    const { error } = await getEnquiryClient().rpc("register_push_device", { device_token: token });
    if (error) throw error;
    return true;
  });
  return pendingRegistration;
}

export async function stopNativePush() {
  if (!isAndroidApp()) return;
  acceptingRegistrations = false;
  revision++;
  // Settle registration before revocation so an in-flight request cannot re-enable it.
  await pendingRegistration.catch((error: unknown) => {
    console.error("NEXUS: Push registration failed before revocation.", error instanceof Error ? error.message : "Database error");
  });
  const { error } = await getEnquiryClient().rpc("unregister_push_devices", {});
  if (error) throw error;
  await PushNotifications.unregister();
  await PushNotifications.removeAllDeliveredNotifications();
}
