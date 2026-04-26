import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
/**
 * Cloudflare Turnstile widget. If no site key is configured (dev), we skip
 * loading the script and immediately resolve with a dev placeholder token
 * so the form remains usable locally.
 */
export function Turnstile({ onToken, siteKey }) {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const key = siteKey ?? import.meta.env.VITE_TURNSTILE_SITE_KEY;
    useEffect(() => {
        if (!key) {
            onToken("dev-bypass-token");
            return;
        }
        const w = window;
        const render = () => {
            if (!containerRef.current || !w.turnstile)
                return;
            widgetIdRef.current = w.turnstile.render(containerRef.current, {
                sitekey: key,
                callback: onToken,
            });
        };
        if (w.turnstile) {
            render();
        }
        else if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
            const script = document.createElement("script");
            script.src = SCRIPT_SRC;
            script.async = true;
            script.defer = true;
            script.addEventListener("load", render);
            document.head.appendChild(script);
        }
        else {
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
        return (_jsxs("p", { className: "text-body-sm text-ink-300", children: ["Captcha disabled in dev (no ", _jsx("code", { children: "VITE_TURNSTILE_SITE_KEY" }), " set)."] }));
    }
    return _jsx("div", { ref: containerRef });
}
