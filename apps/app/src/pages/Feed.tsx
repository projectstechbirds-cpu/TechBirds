import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Badge,
  Button,
  Container,
  Eyebrow,
  FormField,
  Prose,
  Textarea,
} from "@techbirds/ui-kit";
import type { FeedPostOut } from "@techbirds/sdk";
import { ApiError } from "@techbirds/sdk";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";

const POSTER_ROLES = new Set(["admin", "super_admin", "hr"]);
const REACTION_PALETTE = ["👍", "❤️", "🎉", "👀", "🚀"];

const fmtDateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) {
    const body = err.body as { detail?: string } | null;
    return body?.detail ?? fallback;
  }
  return fallback;
}

export default function Feed() {
  const { user } = useAuth();
  const canPost = useMemo(
    () => (user?.roles ?? []).some((r) => POSTER_ROLES.has(r)),
    [user],
  );

  const [posts, setPosts] = useState<FeedPostOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const res = await api.listFeedPosts(1, 20);
    setPosts(res.items);
  };

  useEffect(() => {
    void refresh().catch((err) => setError(describeError(err, "Couldn't load feed")));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await api.createFeedPost({ body_md: body, pinned });
      setBody("");
      setPinned(false);
      await refresh();
    } catch (err) {
      setError(describeError(err, "Couldn't post"));
    } finally {
      setBusy(false);
    }
  };

  const onReact = async (postId: string, emoji: string) => {
    setError(null);
    try {
      const updated = await api.reactToFeedPost(postId, emoji);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    } catch (err) {
      setError(describeError(err, "Couldn't react"));
    }
  };

  const onDelete = async (postId: string) => {
    setError(null);
    try {
      await api.deleteFeedPost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      setError(describeError(err, "Couldn't delete"));
    }
  };

  return (
    <section className="py-9">
      <Container>
        <Eyebrow>Internal feed</Eyebrow>
        <h1 className="mt-3 text-display-md text-ink-900">Feed.</h1>
        <p className="mt-3 max-w-2xl text-body-lg text-ink-500">
          Announcements, milestones, and the small wins. React to nudge a colleague.
        </p>

        {error && (
          <p role="alert" className="mt-5 text-body-sm text-red-600">
            {error}
          </p>
        )}

        {canPost && (
          <form
            onSubmit={onSubmit}
            className="mt-7 space-y-4 rounded-xl border border-line bg-paper-2 p-6"
          >
            <FormField label="New post" htmlFor="feed-body">
              <Textarea
                id="feed-body"
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share something with the team. Markdown supported."
              />
            </FormField>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-body-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                />
                Pin to top
              </label>
              <Button type="submit" disabled={busy || !body.trim()}>
                {busy ? "Posting…" : "Post"}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-9 space-y-6">
          {posts.length === 0 && (
            <p className="text-body-sm text-ink-500">No posts yet.</p>
          )}
          {posts.map((p) => {
            const canDelete = canPost || p.author_id === user?.id;
            return (
              <article
                key={p.id}
                className="rounded-xl border border-line bg-paper p-6"
              >
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-body font-semibold text-ink-900">
                      {p.author_name ?? "Someone"}
                    </p>
                    <p className="text-body-sm text-ink-500">
                      {fmtDateTime.format(new Date(p.created_at))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.pinned && <Badge tone="accent">Pinned</Badge>}
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => onDelete(p.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </header>
                <Prose className="mt-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.body_md}</ReactMarkdown>
                </Prose>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {REACTION_PALETTE.map((emoji) => {
                    const r = p.reactions.find((x) => x.emoji === emoji);
                    const count = r?.count ?? 0;
                    const reacted = r?.reacted ?? false;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onReact(p.id, emoji)}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-body-sm transition-colors ${
                          reacted
                            ? "border-accent-500 bg-accent-50 text-accent-600"
                            : "border-line bg-paper-2 text-ink-700 hover:bg-paper-3"
                        }`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span className="font-semibold">{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
