import { createClient } from "@supabase/supabase-js";

export const enquiryStatuses = ["new", "contacted", "callback", "won", "closed"] as const;
export type EnquiryStatus = typeof enquiryStatuses[number];
export type RequestType = "consultation" | "course-info" | "application";
export type TrendBucket = {
  key: string;
  visits: number;
  enquiries: number;
  converted: number;
  confirmations: number;
  attributed: number;
  converted_visits: number;
};
export type BusinessTrends = {
  tracking_started_at: string;
  legacy_confirmed: number;
  buckets: TrendBucket[];
};
export type BusinessStats = {
  client_enquiries: number;
  converted: number;
  open_enquiries: number;
  overdue_callbacks: number;
  confirmed_value_mad: number;
  confirmed_without_package: number;
  applications: number;
  new_enquiries: number;
  contacted: number;
  callbacks: number;
  closed: number;
  measured_at: string;
};
export type Enquiry = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  phone: string;
  goal: string;
  background: string;
  preferred_time: string;
  request_type: RequestType;
  sessions: number | null;
  total_mad: number | null;
  language: "en" | "fr" | "ar";
  consent: boolean;
  consent_version: string;
  status: EnquiryStatus;
  notes: string;
  next_call_at: string | null;
};

type Database = {
  public: {
    Tables: {
      enquiries: {
        Row: Enquiry;
        Insert: never;
        Update: Pick<Enquiry, "status" | "notes" | "next_call_at">;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      register_push_device: { Args: { device_token: string }; Returns: undefined };
      unregister_push_devices: { Args: Record<string, never>; Returns: undefined };
      push_device_enabled: { Args: Record<string, never>; Returns: boolean };
      business_stats: { Args: Record<string, never>; Returns: BusinessStats[] };
      record_site_visit: { Args: { visit_id: string }; Returns: string };
      business_trends: { Args: { start_date: string; end_date: string; granularity: string }; Returns: BusinessTrends };
      submit_enquiry: { Args: { payload: Record<string, string | number | boolean | null> }; Returns: string };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

let client: ReturnType<typeof createClient<Database>> | undefined;

export function getEnquiryClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_NOT_CONFIGURED");
  if (!client) {
    client = createClient<Database>(url, key, {
      auth: {
        storage: typeof window === "undefined" ? undefined : window.sessionStorage,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

export function isRequestType(value: string): value is RequestType {
  return value === "consultation" || value === "course-info" || value === "application";
}

export const enquiryCopy = {
  en: {
    dashboard: {
      heading: "Good conversations start here.",
      intro: "Your enquiries, next steps and client follow-ups in one place.",
      pipeline: "Your enquiry pipeline",
      snapshot: "Based on the records loaded below—not live updates.",
      results: "Matching enquiries",
      emptyTitle: "A fresh start.",
      emptyHint: "Choose a client on the left to plan their next step.",
      integrations: "Diagnostic session automation",
      setup: "Setup required · not connected",
      setupIntro: "Automatic scheduling and WhatsApp group creation are not enabled yet. No meeting or group has been created.",
      google: "Google Calendar: authorize the academy account to create a free 20-minute Meet session and invite the client and teacher.",
      whatsapp: "WhatsApp: confirm Official Business Account eligibility and a Cloud API number. The client and teacher must accept group invitations.",
      welcome: "Once connected, the welcome message will use the client's language, their name, the teacher's name, the appointment time in Morocco and the Meet link. The group will use the academy logo.",
    },
    diagnosticTitle: "Book your free 20-minute diagnostic",
    diagnosticIntro: "Tell us your goals and availability. Our team will contact you to confirm a time for your free 20-minute English diagnostic. No payment required.",
    diagnosticPreferred: "Your availability for the diagnostic (Morocco time)",
    diagnosticSend: "Request my free diagnostic",
    diagnosticSuccess: "Your free 20-minute diagnostic request has been received. Our team will contact you to confirm your appointment.",
    title: "Your next conversation starts here.",
    intro: "Leave your details. Our team will call you to discuss your goals and confirm the right offer.",
    open: "Request a callback", close: "Close", phoneHint: "Required so our team can call you",
    preferred: "Best time to call (Morocco time)", preferredPh: "e.g. weekdays after 17:00",
    send: "Request my callback", sending: "Sending…",
    success: "Request received. Our team will contact you to discuss the next step.",
    disclaimer: "Sent securely to NEXUS. No payment or confirmed booking at this stage.",
    error: "We could not save your request. Please try again. Your information is still in this form.",
    unavailable: "Online enquiries are not connected yet. Please try again later.",
    limited: "You have recently sent several requests. Please wait 15 minutes before trying again.",
    package: "Selected package", sessions: "sessions", reference: "Reference",
    admin: "Enquiry desk", login: "Admin sign-in", password: "Password", signIn: "Sign in",
    signOut: "Sign out", forbidden: "This account does not have admin access.",
    loginError: "Sign-in failed. Check your credentials and try again.",
    logoutError: "Sign-out failed. Please retry before leaving this device.",
    loadError: "Unable to load enquiries. Please refresh and try again.",
    saveError: "Changes were not saved. Your edits are still shown. Another admin may have updated this request; refresh the records, review it and retry.",
    refresh: "Refresh", search: "Search name, phone, email or goal", all: "All statuses",
    statuses: { new: "New", contacted: "Contacted", callback: "Callback", won: "Confirmed", closed: "Closed" },
    empty: "No enquiries match this view.", select: "Select an enquiry to view every detail.",
    notes: "Private follow-up notes", nextCall: "Next callback (your local time)",
    save: "Save follow-up", saving: "Saving…", saved: "Follow-up saved.",
    status: "Status", received: "Received", language: "Language", consent: "Consent recorded",
    back: "Back to website", loading: "Loading…", more: "Load more", total: "Loaded enquiries",
    details: "Client details", noPackage: "No package selected", yes: "Yes",
    access: "Invite-only access. Public visitors cannot read enquiry records.",
  },
  fr: {
    dashboard: {
      heading: "Les belles conversations commencent ici.",
      intro: "Vos demandes, prochaines étapes et suivis clients au même endroit.",
      pipeline: "Le parcours de vos demandes",
      snapshot: "Calculé sur les demandes chargées ci-dessous, sans mise à jour en direct.",
      results: "Demandes correspondantes",
      emptyTitle: "Une nouvelle conversation.",
      emptyHint: "Choisissez un client à gauche pour préparer la prochaine étape.",
      integrations: "Automatisation du diagnostic",
      setup: "Configuration requise · non connecté",
      setupIntro: "La planification automatique et la création de groupes WhatsApp ne sont pas encore activées. Aucun rendez-vous ni groupe n'a été créé.",
      google: "Google Agenda : autoriser le compte de l'académie à créer un diagnostic gratuit de 20 minutes sur Meet et à inviter le client et l'enseignant.",
      whatsapp: "WhatsApp : confirmer l'éligibilité Official Business Account et un numéro Cloud API. Le client et l'enseignant doivent accepter les invitations au groupe.",
      welcome: "Une fois connecté, le message d'accueil utilisera la langue du client, son nom, le nom de l'enseignant, le créneau à l'heure du Maroc et le lien Meet. Le groupe utilisera le logo de l'académie.",
    },
    diagnosticTitle: "Réservez votre diagnostic gratuit de 20 minutes",
    diagnosticIntro: "Indiquez vos objectifs et vos disponibilités. Notre équipe vous contactera pour confirmer le créneau de votre diagnostic d'anglais gratuit de 20 minutes. Aucun paiement requis.",
    diagnosticPreferred: "Vos disponibilités pour le diagnostic (heure du Maroc)",
    diagnosticSend: "Demander mon diagnostic gratuit",
    diagnosticSuccess: "Votre demande de diagnostic gratuit de 20 minutes a bien été reçue. Notre équipe vous contactera pour confirmer votre rendez-vous.",
    title: "Votre prochaine conversation commence ici.",
    intro: "Laissez vos coordonnées. Notre équipe vous appellera pour comprendre vos objectifs et confirmer l’offre adaptée.",
    open: "Demander un rappel", close: "Fermer", phoneHint: "Obligatoire pour vous rappeler",
    preferred: "Quand vous appeler ? (heure du Maroc)", preferredPh: "Ex. en semaine après 17 h",
    send: "Demander mon rappel", sending: "Envoi…",
    success: "Demande reçue. Notre équipe vous contactera pour convenir de la suite.",
    disclaimer: "Transmis de manière sécurisée à NEXUS. Aucun paiement ni réservation confirmée à cette étape.",
    error: "Votre demande n’a pas pu être enregistrée. Réessayez. Vos informations restent dans ce formulaire.",
    unavailable: "Les demandes en ligne ne sont pas encore connectées. Veuillez réessayer plus tard.",
    limited: "Plusieurs demandes ont été envoyées récemment. Veuillez patienter 15 minutes.",
    package: "Pack choisi", sessions: "séances", reference: "Référence",
    admin: "Bureau des demandes", login: "Connexion administrateur", password: "Mot de passe", signIn: "Se connecter",
    signOut: "Se déconnecter", forbidden: "Ce compte n’a pas accès à l’administration.",
    loginError: "Connexion impossible. Vérifiez vos identifiants et réessayez.",
    logoutError: "Déconnexion impossible. Réessayez avant de quitter cet appareil.",
    loadError: "Impossible de charger les demandes. Actualisez et réessayez.",
    saveError: "Modifications non enregistrées. Vos saisies restent affichées. Un autre admin a peut-être modifié la demande ; actualisez, vérifiez et réessayez.",
    refresh: "Actualiser", search: "Rechercher un nom, téléphone, e-mail ou objectif", all: "Tous les statuts",
    statuses: { new: "Nouveau", contacted: "Contacté", callback: "À rappeler", won: "Confirmé", closed: "Clôturé" },
    empty: "Aucune demande ne correspond.", select: "Choisissez une demande pour consulter tous les détails.",
    notes: "Notes de suivi privées", nextCall: "Prochain rappel (votre heure locale)",
    save: "Enregistrer le suivi", saving: "Enregistrement…", saved: "Suivi enregistré.",
    status: "Statut", received: "Reçue le", language: "Langue", consent: "Consentement enregistré",
    back: "Retour au site", loading: "Chargement…", more: "Charger la suite", total: "Demandes chargées",
    details: "Coordonnées du client", noPackage: "Aucun pack choisi", yes: "Oui",
    access: "Accès sur invitation. Les visiteurs ne peuvent pas consulter les demandes.",
  },
  ar: {
    dashboard: {
      heading: "المحادثات المميزة تبدأ هنا.",
      intro: "الطلبات والخطوات المقبلة ومتابعة العملاء في مكان واحد.",
      pipeline: "مسار الطلبات",
      snapshot: "بناءً على الطلبات المحمّلة أدناه، دون تحديث مباشر.",
      results: "الطلبات المطابقة",
      emptyTitle: "محادثة جديدة.",
      emptyHint: "اختر عميلاً من القائمة لتجهيز الخطوة المقبلة.",
      integrations: "أتمتة الجلسة التشخيصية",
      setup: "يلزم الإعداد · غير متصل",
      setupIntro: "الجدولة التلقائية وإنشاء مجموعات واتساب غير مفعّلين بعد. لم يُنشأ أي موعد أو مجموعة.",
      google: "تقويم Google: منح حساب الأكاديمية صلاحية إنشاء جلسة تشخيصية مجانية لمدة 20 دقيقة على Meet ودعوة العميل والمدرّس.",
      whatsapp: "واتساب: تأكيد أهلية Official Business Account ورقم Cloud API. يجب على العميل والمدرّس قبول دعوات المجموعة.",
      welcome: "بعد الاتصال، ستكون رسالة الترحيب بلغة العميل وستتضمن اسمه واسم المدرّس ووقت الموعد بتوقيت المغرب ورابط Meet. ستستخدم المجموعة شعار الأكاديمية.",
    },
    diagnosticTitle: "احجز جلستك التشخيصية المجانية لمدة 20 دقيقة",
    diagnosticIntro: "أخبرنا بأهدافك وأوقات تفرّغك. سيتواصل معك فريقنا لتأكيد موعد جلستك التشخيصية المجانية في الإنجليزية لمدة 20 دقيقة. لا يلزم أي دفع.",
    diagnosticPreferred: "أوقات تفرّغك للجلسة التشخيصية (بتوقيت المغرب)",
    diagnosticSend: "اطلب جلستي التشخيصية المجانية",
    diagnosticSuccess: "تم استلام طلب جلستك التشخيصية المجانية لمدة 20 دقيقة. سيتواصل معك فريقنا لتأكيد الموعد.",
    title: "محادثتك القادمة تبدأ هنا.",
    intro: "اترك بياناتك. سيتصل بك فريقنا لمناقشة أهدافك وتأكيد العرض المناسب.",
    open: "اطلب اتصالاً", close: "إغلاق", phoneHint: "مطلوب حتى نتمكن من الاتصال بك",
    preferred: "الوقت المناسب للاتصال (بتوقيت المغرب)", preferredPh: "مثلاً أيام الأسبوع بعد الخامسة مساءً",
    send: "إرسال طلب الاتصال", sending: "جارٍ الإرسال…",
    success: "تم استلام طلبك. سيتواصل معك فريقنا لتحديد الخطوة التالية.",
    disclaimer: "يُرسل بأمان إلى NEXUS. لا دفع ولا حجز مؤكد في هذه المرحلة.",
    error: "تعذر حفظ طلبك. حاول مجدداً. تبقى معلوماتك في النموذج.",
    unavailable: "الطلبات عبر الإنترنت غير متصلة بعد. يرجى المحاولة لاحقاً.",
    limited: "أرسلت عدة طلبات مؤخراً. يرجى الانتظار 15 دقيقة.",
    package: "الباقة المختارة", sessions: "حصص", reference: "المرجع",
    admin: "مكتب الطلبات", login: "دخول المسؤول", password: "كلمة المرور", signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج", forbidden: "هذا الحساب لا يملك صلاحية الإدارة.",
    loginError: "تعذر الدخول. تحقق من بياناتك وحاول مجدداً.",
    logoutError: "تعذر تسجيل الخروج. حاول مجدداً قبل مغادرة هذا الجهاز.",
    loadError: "تعذر تحميل الطلبات. حدّث الصفحة وحاول مجدداً.",
    saveError: "لم تُحفظ التغييرات. تبقى تعديلاتك ظاهرة. ربما عدّل مسؤول آخر الطلب؛ حدّث السجلات وراجعها ثم حاول مجدداً.",
    refresh: "تحديث", search: "بحث بالاسم أو الهاتف أو البريد أو الهدف", all: "كل الحالات",
    statuses: { new: "جديد", contacted: "تم التواصل", callback: "إعادة اتصال", won: "مؤكد", closed: "مغلق" },
    empty: "لا توجد طلبات مطابقة.", select: "اختر طلباً لعرض جميع التفاصيل.",
    notes: "ملاحظات متابعة خاصة", nextCall: "موعد الاتصال القادم (بتوقيتك المحلي)",
    save: "حفظ المتابعة", saving: "جارٍ الحفظ…", saved: "تم حفظ المتابعة.",
    status: "الحالة", received: "تاريخ الاستلام", language: "اللغة", consent: "الموافقة مسجلة",
    back: "العودة للموقع", loading: "جارٍ التحميل…", more: "تحميل المزيد", total: "الطلبات المحمّلة",
    details: "بيانات العميل", noPackage: "لم تُحدد باقة", yes: "نعم",
    access: "دخول بالدعوة فقط. لا يمكن للزوار الاطلاع على الطلبات.",
  },
};
