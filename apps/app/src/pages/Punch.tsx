import { useEffect, useState } from "react";
import { Button, Container, Eyebrow } from "@techbirds/ui-kit";
import type { HistoryDay, TodayState } from "@techbirds/sdk";
import { ApiError } from "@techbirds/sdk";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";

const fmtTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
});
const fmtDate = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
  month: "short",
});

function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function Punch() {
  const { user } = useAuth();
  const [today, setToday] = useState<TodayState | null>(null);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const [t, h] = await Promise.all([api.todayState(), api.punchHistory(14)]);
    setToday(t);
    setHistory(h.days);
  };

  useEffect(() => {
    void refresh().catch((err) => {
      setError(err instanceof Error ? err.message : "Couldn't load attendance");
    });
  }, []);

  const onPunch = async () => {
    setError(null);
    setBusy(true);
    try {
      await api.punch();
      await refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.body?.toString() ?? "Couldn't punch" : "Network error",
      );
    } finally {
      setBusy(false);
    }
  };

  const isIn = today?.is_punched_in ?? false;
  const todayMinutes = today?.today_total_minutes ?? 0;
  const lastAt = today?.last_entry?.created_at;

  return (
    <section className="py-9">
      <Container>
        <Eyebrow>Attendance</Eyebrow>
        <h1 className="mt-3 text-display-md text-ink-900">Punch.</h1>
        <p className="mt-3 max-w-2xl text-body-lg text-ink-500">
          Tap once to clock in or out. Your day's hours are calculated from paired in/out punches.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-5 rounded-xl border border-line bg-paper-2 p-6">
          <Button size="lg" onClick={onPunch} disabled={busy || !user?.is_employee}>
            {busy ? "Working…" : isIn ? "Punch out" : "Punch in"}
          </Button>
          <div className="text-body-sm text-ink-500">
            <p>
              <span className="font-semibold text-ink-900">Status:</span>{" "}
              {isIn ? "On the clock" : "Not punched in"}
            </p>
            <p>
              <span className="font-semibold text-ink-900">Today:</span>{" "}
              {fmtMinutes(todayMinutes)}
            </p>
            {lastAt && (
              <p>
                <span className="font-semibold text-ink-900">Last punch:</span>{" "}
                {today?.last_entry?.type ?? ""} at {fmtTime.format(new Date(lastAt))}
              </p>
            )}
          </div>
        </div>

        {!user?.is_employee && (
          <p className="mt-4 text-body-sm text-ink-500">
            Punch is for employees. Ask HR to enable your account.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-body-sm text-red-600">
            {error}
          </p>
        )}

        <h2 className="mt-10 text-display-sm text-ink-900">Last 14 days</h2>
        {history.length === 0 && (
          <p className="mt-4 text-body-sm text-ink-500">No punches yet.</p>
        )}
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {history.map((d) => (
            <li key={d.date} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-body font-semibold text-ink-900">
                  {fmtDate.format(new Date(`${d.date}T00:00:00+05:30`))}
                </p>
                <p className="text-body-sm text-ink-500">
                  {d.entries
                    .map((e) => `${e.type} ${fmtTime.format(new Date(e.created_at))}`)
                    .join(" · ")}
                </p>
              </div>
              <span className="text-body-sm font-semibold text-ink-900">
                {fmtMinutes(d.total_minutes)}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
