import { notFound } from "next/navigation";
import Link from "next/link";
import { serialize } from "next-mdx-remote/serialize";
import { getArticle, getCategoryBySlug, CATEGORY_LABELS } from "@/lib/help/loader";
import { HelpBreadcrumb } from "@/components/help/HelpBreadcrumb";
import { ArticleBody } from "@/components/help/ArticleBody";
import { CARD, SECTION_LABEL } from "@/lib/ui-classes";

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { category, slug } = await params;
  const article = await getArticle(category, slug);
  return { title: article ? `${article.title} — Help Center — DZC DMS` : "Help Center" };
}

export default async function HelpArticlePage({ params }: Props) {
  const { category, slug } = await params;
  const article = await getArticle(category, slug);

  if (!article) notFound();

  const mdxSource = await serialize(article.content);
  const categoryLabel = CATEGORY_LABELS[category]?.label ?? category;
  const cat = getCategoryBySlug(category);
  const relatedArticles = article.relatedArticles ?? [];

  return (
    <div className="max-w-2xl">
      <HelpBreadcrumb
        crumbs={[
          { label: "Help Center", href: "/help" },
          { label: categoryLabel, href: `/help/${category}` },
          { label: article.title },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{article.title}</h1>
        {article.summary && (
          <p className="text-sm text-muted-foreground mt-1">{article.summary}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/70">
          {article.estimatedReadingTime && (
            <span>{article.estimatedReadingTime} min read</span>
          )}
          {article.lastUpdated && (
            <span>Updated {article.lastUpdated}</span>
          )}
          {article.audience && (
            <span>For: {article.audience}</span>
          )}
        </div>
      </div>

      <ArticleBody source={mdxSource} />

      {relatedArticles.length > 0 && cat && (
        <div className={`${CARD} mt-8 p-5`}>
          <p className={`${SECTION_LABEL} mb-3`}>Related Articles</p>
          <ul className="space-y-1">
            {relatedArticles.map((relSlug) => {
              const relArticle = cat.articles.find((a) => a.slug === relSlug);
              if (!relArticle) return null;
              return (
                <li key={relSlug}>
                  <Link
                    href={`/help/${category}/${relSlug}`}
                    className="text-sm text-primary hover:underline underline-offset-2"
                  >
                    {relArticle.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-6 pt-4 border-t">
        <Link
          href={`/help/${category}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to {categoryLabel}
        </Link>
      </div>
    </div>
  );
}
