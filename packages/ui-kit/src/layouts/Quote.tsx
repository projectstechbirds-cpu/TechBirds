export interface QuoteProps {
  quote: string;
  author: string;
  role?: string;
  org?: string;
}

export const Quote = ({ quote, author, role, org }: QuoteProps) => (
  <figure className="rounded-lg border border-line bg-paper p-6">
    <blockquote className="text-body-lg text-ink-700">&ldquo;{quote}&rdquo;</blockquote>
    <figcaption className="mt-4 text-body-sm text-ink-500">
      <span className="font-semibold text-ink-900">{author}</span>
      {role && <span> — {role}</span>}
      {org && <span>, {org}</span>}
    </figcaption>
  </figure>
);
