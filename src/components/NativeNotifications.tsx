"use client";

import { useEffect, useState } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import type { PluginListenerHandle } from "@capacitor/core";
import { useSettings } from "@/components/SettingsProvider";
import { getEnquiryClient } from "@/lib/enquiries";
import { isAndroidApp, prepareNativePush, registerNativePush, stopNativePush } from "@/lib/native-push";

const copy = {
  en: { title: "New-enquiry notifications", description: "Optional alerts on this phone. Client details never appear on the lock screen. Sign in again after restarting the app.", enable: "Enable notifications", disable: "Disable notifications", enabled: "Notifications enabled", denied: "Notifications are blocked. Allow them in Android app settings, then retry.", error: "Notifications could not be updated. Please retry.", busy: "Updating..." },
  fr: { title: "Notifications des nouvelles demandes", description: "Alertes facultatives sur ce téléphone, sans détails clients sur l'écran verrouillé. Reconnectez-vous après le redémarrage de l'application.", enable: "Activer les notifications", disable: "Désactiver les notifications", enabled: "Notifications activées", denied: "Notifications bloquées. Autorisez-les dans les paramètres Android, puis réessayez.", error: "Impossible de modifier les notifications. Réessayez.", busy: "Mise à jour..." },
  ar: { title: "إشعارات الطلبات الجديدة", description: "تنبيهات اختيارية على هذا الهاتف دون تفاصيل العملاء على شاشة القفل. سجل الدخول مجدداً بعد إعادة تشغيل التطبيق.", enable: "تفعيل الإشعارات", disable: "إيقاف الإشعارات", enabled: "الإشعارات مفعلة", denied: "الإشعارات محظورة. اسمح بها في إعدادات أندرويد ثم أعد المحاولة.", error: "تعذر تحديث الإشعارات. أعد المحاولة.", busy: "جار التحديث..." },
};

export default function NativeNotifications({ onEnquiry }: { onEnquiry: () => void }) {
  const { lang } = useSettings();
  const t = copy[lang];
  const [native, setNative] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<"denied" | "error" | "">("");

  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(() => {
      console.error("NEXUS: Notification registration timed out.");
      setMessage("error");
      setBusy(false);
    }, 15000);
    return () => window.clearTimeout(timer);
  }, [busy]);

  useEffect(() => {
    if (!isAndroidApp()) return;
    let active = true;
    const handles: PluginListenerHandle[] = [];
    const listen = async () => {
      const add = async (handle: Promise<PluginListenerHandle>) => {
        const listener = await handle;
        if (active) handles.push(listener);
        else await listener.remove();
      };
      try {
        setNative(true);
        await add(PushNotifications.addListener("registration", ({ value }) => {
          if (!active) return;
          void registerNativePush(value).then((registered) => {
            if (active && registered) { setEnabled(true); setBusy(false); setMessage(""); }
          }).catch((error: unknown) => {
            console.error("NEXUS: Push registration failed.", error instanceof Error ? error.message : "Database error");
            if (active) { setMessage("error"); setBusy(false); }
          });
        }));
        await add(PushNotifications.addListener("registrationError", (error) => {
          console.error("NEXUS: Android notification registration failed.", error.error);
          if (active) { setMessage("error"); setBusy(false); }
        }));
        await add(PushNotifications.addListener("pushNotificationReceived", () => { if (active) onEnquiry(); }));
        await add(PushNotifications.addListener("pushNotificationActionPerformed", () => { if (active) onEnquiry(); }));
        await PushNotifications.createChannel({ id: "enquiries", name: "NEXUS enquiries", importance: 4, visibility: 0 });
        const { data, error } = await getEnquiryClient().rpc("push_device_enabled", {});
        if (error) throw error;
        const permissions = await PushNotifications.checkPermissions();
        if (!active) return;
        setEnabled(Boolean(data) && permissions.receive === "granted");
        setReady(true);
        if (data && permissions.receive === "granted") {
          prepareNativePush();
          await PushNotifications.register();
        }
      } catch (error) {
        console.error("NEXUS: Notification setup failed.", error instanceof Error ? error.message : "Native error");
        if (active) { setReady(true); setMessage("error"); }
      }
    };
    void listen();
    return () => {
      active = false;
      for (const handle of handles) void handle.remove().catch((error: unknown) => {
        console.error("NEXUS: Notification listener cleanup failed.", error);
      });
    };
  }, [onEnquiry]);

  async function toggle() {
    setBusy(true);
    setMessage("");
    try {
      if (enabled) {
        await stopNativePush();
        setEnabled(false);
        setBusy(false);
      } else {
        let permission = await PushNotifications.checkPermissions();
        if (permission.receive === "prompt" || permission.receive === "prompt-with-rationale") permission = await PushNotifications.requestPermissions();
        if (permission.receive !== "granted") { setMessage("denied"); setBusy(false); return; }
        prepareNativePush();
        await PushNotifications.register();
      }
    } catch (error) {
      console.error("NEXUS: Notification preference failed.", error instanceof Error ? error.message : "Native error");
      setMessage("error");
      setBusy(false);
    }
  }

  if (!native) return null;
  return <section className="admin-notifications" aria-busy={busy}>
    <h2>{t.title}</h2><p>{t.description}</p>
    <button type="button" disabled={busy || !ready} onClick={() => void toggle()}>{busy ? t.busy : enabled ? t.disable : t.enable}</button>
    {enabled && <p role="status">{t.enabled}</p>}
    {message && <p className="enquiry-error" role="alert">{t[message]}</p>}
  </section>;
}
