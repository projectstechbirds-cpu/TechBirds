import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Container, Eyebrow, FormField, Input } from "@techbirds/ui-kit";
import { ApiError } from "@techbirds/sdk";
import { siteMeta } from "@techbirds/content";
import { useAuth } from "@/auth/AuthContext";

type Step = "email" | "otp";

interface LocationState {
  from?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, requestOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dest = (location.state as LocationState | null)?.from ?? "/dashboard";

  useEffect(() => {
    if (user) navigate(dest, { replace: true });
  }, [user, dest, navigate]);

  const onRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestOtp(email);
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? "Couldn't send code, try again." : "Network error.");
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await verifyOtp(email, code);
      navigate(dest, { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 400
          ? "That code is invalid or expired."
          : "Couldn't sign in, try again.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-2">
      <Container>
        <div className="mx-auto max-w-md rounded-xl border border-line bg-paper p-7">
          <Eyebrow>{siteMeta.brand} portal</Eyebrow>
          <h1 className="mt-3 text-display-md text-ink-900">Sign in.</h1>
          <p className="mt-3 text-body text-ink-500">
            Enter your work email — we'll send a 6-digit code.
          </p>

          {step === "email" ? (
            <form className="mt-6 flex flex-col gap-4" onSubmit={onRequest}>
              <FormField label="Work email" htmlFor="email" required>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@techbirdsgroup.com"
                />
              </FormField>
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? "Sending…" : "Send code"}
              </Button>
            </form>
          ) : (
            <form className="mt-6 flex flex-col gap-4" onSubmit={onVerify}>
              <FormField label="6-digit code" htmlFor="otp" hint={`Sent to ${email}`} required>
                <Input
                  id="otp"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                />
              </FormField>
              <Button type="submit" size="lg" disabled={busy || code.length !== 6}>
                {busy ? "Verifying…" : "Verify"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
                className="text-body-sm text-ink-500 hover:text-ink-900"
              >
                Use a different email
              </button>
            </form>
          )}

          {error && (
            <p role="alert" className="mt-4 text-body-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}
