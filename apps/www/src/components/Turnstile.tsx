import { useEffect, useRef } from "react";

interface TurnstileWindow extends Window {
  turnstile?: {
    render: (
      el: HTMLElement,
      opts: { sitekey: string; callback: (token: string) => void; theme?: "light" | "dark" },
    ) => string;
    remove: (id: string) => void;
    reset: (id?: string) => void;
  };
}

interface TurnstileProps {
  onToken: (token: string) => void;
  /** Override site key (defaults to VITE_TURNSTILE_SITE_KEY). */
  siteKey?: string;
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Cloudflare Turnstile widget. If no site key is configured (dev), we skip
 * loading the script and immediately resolve with a dev placeholder token
 * so the form remains usable locally.
 */
export function Turnstile({ onToken, siteKey }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const key = siteKey ?? (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined);

  useEffect(() => {
    if (!key) {
      onToken("dev-bypass-token");
      return;
    }

    const w = window as TurnstileWindow;
    const render = () => {
      if (!containerRef.current || !w.turnstile) return;
      widgetIdRef.current = w.turnstile.render(containerRef.current, {
        sitekey: key,
        callback: onToken,
      });
    };

    if (w.turnstile) {
      render();
    } else if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", render);
      document.head.appendChild(script);
    } else {
      const interval = window.setInterval(() => {
        if (w.turnstile) {
          render();
          window.clearInterval(interval);
        }
      }, 200);
      return () => window.clearInterval(interval);
    }

    return () => {
      if (widgetIdRef.current && w.turnstile) {
        w.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [key, onToken]);

  if (!key) {
    return (
      <p className="text-body-sm text-ink-300">
        Captcha disabled in dev (no <code>VITE_TURNSTILE_SITE_KEY</code> set).
      </p>
    );
  }
  return <div ref={containerRef} />;
}
