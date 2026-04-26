import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Container,
  Eyebrow,
  FormField,
  Input,
  Select,
  Textarea,
} from "@techbirds/ui-kit";
import type {
  LeaveBalanceOut,
  LeaveDecision,
  LeaveRequestOut,
  LeaveTypeOut,
} from "@techbirds/sdk";
import { ApiError } from "@techbirds/sdk";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";

const APPROVER_ROLES = new Set(["admin", "super_admin", "hr"]);

const fmtDate = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function statusTone(s: LeaveRequestOut["status"]) {
  if (s === "approved") return "success" as const;
  if (s === "rejected" || s === "cancelled") return "danger" as const;
  return "warning" as const;
}

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) {
    const body = err.body as { detail?: string } | null;
    return body?.detail ?? fallback;
  }
  return fallback;
}

export default function Leave() {
  const { user } = useAuth();
  const isApprover = useMemo(
    () => (user?.roles ?? []).some((r) => APPROVER_ROLES.has(r)),
    [user],
  );

  const [types, setTypes] = useState<LeaveTypeOut[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceOut[]>([]);
  const [requests, setRequests] = useState<LeaveRequestOut[]>([]);
  const [pending, setPending] = useState<LeaveRequestOut[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [typeId, setTypeId] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const [t, b, r] = await Promise.all([
      api.listLeaveTypes(),
      api.myLeaveBalance(),
      api.myLeaveRequests(50),
    ]);
    setTypes(t);
    setBalances(b);
    setRequests(r);
    if (!typeId && t.length) {
      const first = t[0];
      if (first) setTypeId(String(first.id));
    }
    if (isApprover) {
      const p = await api.listPendingLeave();
      setPending(p);
    }
  };

  useEffect(() => {
    void refresh().catch((err) => setError(describeError(err, "Couldn't load leave")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApprover]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.createLeaveRequest({
        leave_type_id: Number(typeId),
        from_date: from,
        to_date: to,
        reason: reason || undefined,
      });
      setFrom("");
      setTo("");
      setReason("");
      await refresh();
    } catch (err) {
      setError(describeError(err, "Couldn't submit request"));
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async (id: string) => {
    setError(null);
    try {
      await api.cancelLeaveRequest(id);
      await refresh();
    } catch (err) {
      setError(describeError(err, "Couldn't cancel"));
    }
  };

  const onDecide = async (id: string, decision: LeaveDecision["decision"]) => {
    setError(null);
    try {
      await api.decideLeave(id, { decision });
      await refresh();
    } catch (err) {
      setError(describeError(err, "Couldn't decide"));
    }
  };

  return (
    <section className="py-9">
      <Container>
        <Eyebrow>Time off</Eyebrow>
        <h1 className="mt-3 text-display-md text-ink-900">Leave.</h1>
        <p className="mt-3 max-w-2xl text-body-lg text-ink-500">
          Track your balance, apply for time off, and watch approvals come through.
        </p>

        {error && (
          <p role="alert" className="mt-5 text-body-sm text-red-600">
            {error}
          </p>
        )}

        <h2 className="mt-9 text-display-sm text-ink-900">Your balance</h2>
        {balances.length === 0 ? (
          <p className="mt-3 text-body-sm text-ink-500">
            No balances yet. Once HR allocates quota for the year it'll appear here.
          </p>
        ) : (
          <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {balances.map((b) => (
              <Card key={b.leave_type_id}>
                <CardTitle>{b.leave_type_name}</CardTitle>
                <CardBody className="mt-2">
                  <p className="text-display-sm text-ink-900">{b.remaining}</p>
                  <p className="text-body-sm text-ink-500">
                    of {b.quota} days · {b.used} used
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {user?.is_employee && (
          <>
            <h2 className="mt-10 text-display-sm text-ink-900">Apply for leave</h2>
            <form
              onSubmit={onSubmit}
              className="mt-4 grid gap-5 rounded-xl border border-line bg-paper-2 p-6 md:grid-cols-2"
            >
              <FormField label="Leave type" htmlFor="leave-type" required>
                <Select
                  id="leave-type"
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                  required
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <div className="hidden md:block" />
              <FormField label="From" htmlFor="leave-from" required>
                <Input
                  id="leave-from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  required
                />
              </FormField>
              <FormField label="To" htmlFor="leave-to" required>
                <Input
                  id="leave-to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Reason" htmlFor="leave-reason" className="md:col-span-2">
                <Textarea
                  id="leave-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="A short note for your manager (optional)"
                />
              </FormField>
              <div className="md:col-span-2">
                <Button type="submit" disabled={busy || !typeId || !from || !to}>
                  {busy ? "Submitting…" : "Submit request"}
                </Button>
              </div>
            </form>
          </>
        )}

        <h2 className="mt-10 text-display-sm text-ink-900">My requests</h2>
        {requests.length === 0 ? (
          <p className="mt-3 text-body-sm text-ink-500">No requests yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-body font-semibold text-ink-900">
                    {r.leave_type_name} · {r.days} day{r.days === 1 ? "" : "s"}
                  </p>
                  <p className="text-body-sm text-ink-500">
                    {fmtDate.format(new Date(`${r.from_date}T00:00:00+05:30`))} →{" "}
                    {fmtDate.format(new Date(`${r.to_date}T00:00:00+05:30`))}
                  </p>
                  {r.reason && <p className="mt-1 text-body-sm text-ink-500">{r.reason}</p>}
                  {r.decision_note && (
                    <p className="mt-1 text-body-sm text-ink-500">Note: {r.decision_note}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  {(r.status === "pending" || r.status === "approved") && (
                    <Button variant="ghost" size="sm" onClick={() => onCancel(r.id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {isApprover && (
          <>
            <h2 className="mt-10 text-display-sm text-ink-900">Pending approvals</h2>
            {pending.length === 0 ? (
              <p className="mt-3 text-body-sm text-ink-500">Nothing waiting on you.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                {pending.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <p className="text-body font-semibold text-ink-900">
                        {r.user_name ?? "Employee"} · {r.leave_type_name}
                      </p>
                      <p className="text-body-sm text-ink-500">
                        {fmtDate.format(new Date(`${r.from_date}T00:00:00+05:30`))} →{" "}
                        {fmtDate.format(new Date(`${r.to_date}T00:00:00+05:30`))} · {r.days} day
                        {r.days === 1 ? "" : "s"}
                      </p>
                      {r.reason && <p className="mt-1 text-body-sm text-ink-500">{r.reason}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => onDecide(r.id, "approved")}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDecide(r.id, "rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Container>
    </section>
  );
}
