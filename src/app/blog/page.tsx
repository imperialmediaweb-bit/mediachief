import type { Metadata } from "next";
import { BlogCard } from "@/components/blog/BlogCard";
import { getAllPosts } from "@/lib/mdx";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides on press releases, PR strategy and media distribution for U.S. businesses.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const posts = getAllPosts();
  return (
    <>
      <section className="bg-brand-navy text-white">
        <div className="container py-20 text-center">
          <p className="eyebrow text-brand-gold">Media Chief Blog</p>
          <h1 className="h1 mt-3 text-white">Guides, strategies and case studies</h1>
          <p className="lead mx-auto mt-6 max-w-2xl text-white/85">
            Practical articles on press releases, PR, media distribution and SEO — everything you
            need to maximize your visibility.
          </p>
        </div>
      </section>

      <section className="section bg-newsprint">
        <div className="container">
          {posts.length === 0 ? (
            <p className="text-center text-slate-600">Articles coming soon. Check back shortly.</p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
