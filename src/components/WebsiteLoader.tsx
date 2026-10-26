"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSettings } from "@/components/SettingsProvider";

export default function WebsiteLoader({ children }: { children: ReactNode }) {
  const { t } = useSettings();
  const container = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      console.warn("NEXUS: Initial loading is taking longer than expected; offering manual access.");
      setSlow(true);
    }, 12000);
    const completed = new Set<string>();
    function complete(step: string) {
      if (cancelled) return;
      completed.add(step);
      setProgress(Math.round(completed.size / 3 * 100));
      if (completed.size === 3) { clearTimeout(timeout); setReady(true); }
    }
    const content = container.current;
    function checkScene() {
      if (content?.querySelector('[data-scene-ready="true"]')) complete("scene");
    }
    const observer = new MutationObserver(checkScene);
    if (content) observer.observe(content, { subtree: true, attributes: true, attributeFilter: ["data-scene-ready"] });
    checkScene();
    void document.fonts.ready.then(() => complete("fonts"));
    const onLoad = () => complete("page");
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => {
      cancelled = true;
      observer.disconnect();
      clearTimeout(timeout);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  useEffect(() => {
    if (ready) return;
    const content = container.current;
    if (content) content.inert = true;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      if (content) content.inert = false;
      document.body.style.overflow = overflow;
    };
  }, [ready]);

  return (
    <>
      <noscript><style>{`.website-loader{display:none}.website-content[data-ready="false"]{visibility:visible}`}</style></noscript>
      {!ready && (
        <div className="website-loader">
          <div className="website-loader-content">
            <span className="website-loader-wordmark">NEXUS<span>.</span></span>
            <p id="website-loading-label" role="status">{t.hero.loadingLabel}</p>
            <div className="website-loader-track" role="progressbar" aria-labelledby="website-loading-label"
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <span className="website-loader-percent" aria-hidden="true">{progress}%</span>
            {slow && (
              <div className="website-loader-slow">
                <p>{t.hero.loadingSlow}</p>
                <button type="button" onClick={() => setReady(true)}>{t.hero.loadingContinue}</button>
              </div>
            )}
          </div>
        </div>
      )}
      <div ref={container} className="website-content" data-ready={ready} aria-busy={!ready}>
        {children}
      </div>
    </>
  );
}
