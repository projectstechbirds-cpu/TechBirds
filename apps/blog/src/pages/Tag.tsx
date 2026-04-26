import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LinkCard, PageHero, Section } from "@techbirds/ui-kit";
import type { BlogPostSummary } from "@techbirds/sdk";
import { siteMeta } from "@techbirds/content";
import { Seo } from "@/components/Seo";
import { PostMeta } from "@/components/PostMeta";
import { api } from "@/lib/api";

export default function Tag() {
  const { tag = "" } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listBlogPosts({ tag, pageSize: 24 })
      .then((list) => !cancelled && setPosts(list.items))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tag]);

  return (
    <>
      <Seo
        title={`#${tag}`}
        description={`Posts tagged ${tag} on the TechBirds Journal.`}
        canonical={`${siteMeta.blogUrl}/tag/${encodeURIComponent(tag)}`}
      />
      <PageHero
        eyebrow="Tag"
        title={`#${tag}`}
        lead={`All journal posts tagged with ${tag}.`}
      />
      <Section padding="md">
        {loading && <p className="text-body text-ink-500">Loading…</p>}
        {!loading && posts.length === 0 && (
          <p className="text-body text-ink-500">
            Nothing here yet.{" "}
            <Link to="/" className="text-accent-600 hover:underline">
              Back to all posts →
            </Link>
          </p>
        )}
        {posts.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
