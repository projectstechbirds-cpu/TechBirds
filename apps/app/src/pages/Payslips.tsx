import { useEffect, useState } from "react";
import { Badge, Button, Container, Eyebrow } from "@techbirds/ui-kit";
import type { PayslipOut } from "@techbirds/sdk";
import { ApiError } from "@techbirds/sdk";
import { api } from "@/lib/api";

const MONTHS = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const fmtMoney = (v: string) =>
  `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) {
    const body = err.body as { detail?: string } | null;
    return body?.detail ?? fallback;
  }
  return fallback;
}

export default function Payslips() {
  const [items, setItems] = useState<PayslipOut[]>([]);
  const [year, setYear] = useState<number | "all">("all");
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const y = year === "all" ? undefined : year;
    setItems(await api.myPayslips(y));
  };

  useEffect(() => {
    void refresh().catch((err) => setError(describeError(err, "Couldn't load payslips")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const onDownload = async (id: string) => {
    setError(null);
    try {
      const { url } = await api.payslipUrl(id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(describeError(err, "Couldn't fetch download link"));
    }
  };

  const years = Array.from(new Set(items.map((p) => p.year))).sort((a, b) => b - a);

  return (
    <section className="py-9">
      <Container>
        <Eyebrow>Payroll</Eyebrow>
        <h1 className="mt-3 text-display-md text-ink-900">Payslips.</h1>
        <p className="mt-3 max-w-2xl text-body-lg text-ink-500">
          Released payslips appear here. PDFs open via a 5-minute signed link.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="text-body-sm font-semibold text-ink-700" htmlFor="year-filter">
            Year
          </label>
          <select
            id="year-filter"
            value={year}
            onChange={(e) =>
              setYear(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className="h-10 rounded-md border border-line bg-paper px-3 text-body"
          >
            <option value="all">All</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-body-sm text-red-600">
            {error}
          </p>
        )}

        {items.length === 0 ? (
          <p className="mt-6 text-body-sm text-ink-500">
            No released payslips yet. They'll show up here once payroll for the month is released.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-line rounded-xl border border-line">
            {items.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              >
                <div>
                  <p className="text-body font-semibold text-ink-900">
                    {MONTHS[p.month]} {p.year}
                  </p>
                  <p className="text-body-sm text-ink-500">
                    Net {fmtMoney(p.net_pay)} · Gross {fmtMoney(p.gross)} · Paid {p.paid_days} /{" "}
                    {p.working_days} days
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {p.has_pdf ? (
                    <Button size="sm" onClick={() => onDownload(p.id)}>
                      Download PDF
                    </Button>
                  ) : (
                    <Badge tone="warning">PDF pending</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
