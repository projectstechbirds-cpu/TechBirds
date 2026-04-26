import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LinkCard, PageHero, Section, SectionHeader } from "@techbirds/ui-kit";
import type { BlogPostSummary, BlogTag } from "@techbirds/sdk";
import { Seo } from "@/components/Seo";
import { PostMeta } from "@/components/PostMeta";
import { api } from "@/lib/api";
import { siteMeta } from "@techbirds/content";

export default function Index() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listBlogPosts({ pageSize: 24 }), api.listBlogTags()])
      .then(([list, tagList]) => {
        if (cancelled) return;
        setPosts(list.items);
        setTags(tagList);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Seo
        title={`${siteMeta.brand} Journal`}
        description="Engineering notes, design decisions, and stories from the TechBirds team."
        canonical={`${siteMeta.blogUrl}/`}
      />
      <PageHero
        eyebrow="Notes from the studio"
        title="Journal."
        lead="Engineering notes, design decisions, and stories from inside the studio."
        meta={tags.length > 0 ? <TagStrip tags={tags} /> : null}
      />
      <Section padding="md">
        <SectionHeader title="Recent posts" />
        {loading && <p className="mt-5 text-body text-ink-500">Loading…</p>}
        {error && <p className="mt-5 text-body text-ink-500">Couldn't load posts: {error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p className="mt-5 text-body text-ink-500">No posts yet — check back soon.</p>
        )}
        {posts.length > 0 && (
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <LinkCard
                key={post.id}
                asChild
                eyebrow={post.tags[0] ?? "Journal"}
                title={post.title}
                body={post.excerpt}
                meta={
                  <PostMeta
                    publishedAt={post.published_at}
                    readingMinutes={post.reading_minutes}
                    author={post.author_name}
                  />
                }
              >
                <Link to={`/p/${post.slug}`} />
              </LinkCard>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

function TagStrip({ tags }: { tags: BlogTag[] }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span>Topics:</span>
      {tags.slice(0, 8).map((t) => (
        <Link
          key={t.tag}
          to={`/tag/${encodeURIComponent(t.tag)}`}
          className="rounded-full border border-line px-2.5 py-0.5 text-body-sm text-ink-500 hover:border-ink-500 hover:text-ink-900"
        >
          {t.tag}
          <span className="ml-1 text-ink-300">{t.count}</span>
        </Link>
      ))}
    </span>
  );
}
