interface PostMetaProps {
  publishedAt: string | null;
  readingMinutes: number;
  author?: string | null;
}

const fmt = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });

export function PostMeta({ publishedAt, readingMinutes, author }: PostMetaProps) {
  const parts: string[] = [];
  if (author) parts.push(author);
  if (publishedAt) parts.push(fmt.format(new Date(publishedAt)));
  parts.push(`${readingMinutes} min read`);
  return <span className="text-body-sm text-ink-300">{parts.join(" · ")}</span>;
}
