import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge, LinkCard, PageHero, Prose, Section } from "@techbirds/ui-kit";
import type { BlogPostDetail, BlogPostSummary } from "@techbirds/sdk";
import { siteMeta } from "@techbirds/content";
import { Seo } from "@/components/Seo";
import { PostMeta } from "@/components/PostMeta";
import { api } from "@/lib/api";

export default function Post() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [related, setRelated] = useState<BlogPostSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPost(null);
    setError(null);
    let cancelled = false;
    api
      .getBlogPost(slug)
      .then(async (p) => {
        if (cancelled) return;
        setPost(p);
        if (p.tags[0]) {
          const list = await api.listBlogPosts({ tag: p.tags[0], pageSize: 4 });
          if (cancelled) return;
          setRelated(list.items.filter((r) => r.slug !== p.slug).slice(0, 3));
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return (
      <PageHero
        eyebrow="Not found"
        title="That post doesn't exist."
        lead={
          <Link to="/" className="text-accent-600 hover:underline">
            Back to the journal
          </Link>
        }
        bordered={false}
      />
    );
  }

  if (!post) {
    return <PageHero eyebrow="Loading" title="…" bordered={false} />;
  }

  const canonical = `${siteMeta.blogUrl}/p/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at ?? undefined,
    author: post.author_name ? { "@type": "Person", name: post.author_name } : undefined,
    publisher: { "@type": "Organization", name: siteMeta.brand },
    mainEntityOfPage: canonical,
  };

  return (
    <>
      <Seo
        title={post.title}
        description={post.excerpt}
        canonical={canonical}
        type="article"
        image={post.cover_image ?? undefined}
        publishedAt={post.published_at}
        jsonLd={jsonLd}
      />
      <PageHero
        eyebrow={post.tags[0] ?? "Journal"}
        title={post.title}
        lead={post.excerpt}
        meta={
          <PostMeta
            publishedAt={post.published_at}
            readingMinutes={post.reading_minutes}
            author={post.author_name}
          />
        }
      />
      <Section padding="md">
        <div className="grid gap-9 md:grid-cols-12">
          <article className="md:col-span-8">
            {post.cover_image && (
              <img
                src={post.cover_image}
                alt={post.title}
                className="mb-7 w-full rounded-lg border border-line"
              />
            )}
            <Prose>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body_md}</ReactMarkdown>
            </Prose>
          </article>
          <aside className="md:col-span-4">
            <div className="sticky top-24 space-y-5">
              <div>
                <p className="text-body-sm font-semibold text-ink-900">Tags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <Link key={t} to={`/tag/${encodeURIComponent(t)}`}>
                      <Badge>{t}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-body-sm font-semibold text-ink-900">Studio</p>
                <p className="mt-2 text-body-sm text-ink-500">
                  Want to work with us?{" "}
                  <a
                    href={`${siteMeta.baseUrl}/contact`}
                    className="text-accent-600 hover:underline"
                  >
                    Start a conversation →
                  </a>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </Section>
      {related.length > 0 && (
        <Section tone="muted" padding="md">
          <h2 className="text-display-sm text-ink-900">Related notes</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {related.map((r) => (
              <LinkCard
                key={r.id}
                asChild
                eyebrow={r.tags[0] ?? "Journal"}
                title={r.title}
                body={r.excerpt}
                meta={
                  <PostMeta
                    publishedAt={r.published_at}
                    readingMinutes={r.reading_minutes}
                    author={r.author_name}
                  />
                }
              >
                <Link to={`/p/${r.slug}`} />
              </LinkCard>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
