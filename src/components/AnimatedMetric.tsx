"use client";

import { useEffect } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { Lang } from "@/lib/i18n";

export default function AnimatedMetric({ value, lang, percent = false }: { value: number; lang: Lang; percent?: boolean }) {
  const reducedMotion = useReducedMotion();
  const count = useSpring(0, { stiffness: 100, damping: 25 });
  const format = (current: number) => percent
    ? new Intl.NumberFormat(lang, { style: "percent", maximumFractionDigits: 1 }).format(current)
    : Math.round(current).toLocaleString(lang);
  const formatted = useTransform(count, format);
  useEffect(() => {
    if (reducedMotion) count.jump(value);
    else count.set(value);
  }, [count, reducedMotion, value]);
  return <span className="animated-metric" aria-label={format(value)}><motion.span aria-hidden="true">{formatted}</motion.span></span>;
}
