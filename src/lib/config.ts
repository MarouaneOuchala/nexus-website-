// Digits only, with country code (e.g. 212612345678). When empty, wa.me opens WhatsApp's contact picker.
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

// Set by the GitHub Pages workflow for project sites (e.g. /nexus-website-).
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
