import { useEffect, useState } from "react";
import { Badge, Button, Container, Eyebrow } from "@techbirds/ui-kit";
import type { DocumentOut } from "@techbirds/sdk";
import { ApiError, DOC_TYPE_LABELS } from "@techbirds/sdk";
import { api } from "@/lib/api";

const fmtDate = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) {
    const body = err.body as { detail?: string } | null;
    return body?.detail ?? fallback;
  }
  return fallback;
}

export default function Documents() {
  const [items, setItems] = useState<DocumentOut[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .myDocuments()
      .then(setItems)
      .catch((err) => setError(describeError(err, "Couldn't load documents")));
  }, []);

  const onDownload = async (id: string) => {
    setError(null);
    try {
      const { url } = await api.documentUrl(id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(describeError(err, "Couldn't fetch download link"));
    }
  };

  return (
    <section className="py-9">
      <Container>
        <Eyebrow>HR documents</Eyebrow>
        <h1 className="mt-3 text-display-md text-ink-900">Documents.</h1>
        <p className="mt-3 max-w-2xl text-body-lg text-ink-500">
          Offer, hike, Form 16, ID card, and exit paperwork live here. Links expire in 5 minutes.
        </p>

        {error && (
          <p role="alert" className="mt-4 text-body-sm text-red-600">
            {error}
          </p>
        )}

        {items.length === 0 ? (
          <p className="mt-6 text-body-sm text-ink-500">
            No documents on file yet. HR will share them as they're issued.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-line rounded-xl border border-line">
            {items.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              >
                <div>
                  <p className="text-body font-semibold text-ink-900">{d.title}</p>
                  <p className="text-body-sm text-ink-500">
                    <Badge tone="neutral" className="mr-2">
                      {DOC_TYPE_LABELS[d.doc_type]}
                    </Badge>
                    {d.period_label ? `${d.period_label} · ` : ""}Issued{" "}
                    {fmtDate.format(new Date(d.issued_at))}
                  </p>
                </div>
                <Button size="sm" onClick={() => onDownload(d.id)}>
                  Download
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
