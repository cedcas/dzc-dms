import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCategoryBySlug } from "@/lib/help/loader";
import { HelpBreadcrumb } from "@/components/help/HelpBreadcrumb";
import { CARD, CARD_HEADER, CARD_TITLE, PAGE_TITLE } from "@/lib/ui-classes";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  return { title: cat ? `${cat.label} — Help Center — DZC DMS` : "Help Center" };
}

export default async function HelpCategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = getCategoryBySlug(category);

  if (!cat) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <HelpBreadcrumb
        crumbs={[
          { label: "Help Center", href: "/help" },
          { label: cat.label },
        ]}
      />

      <div>
        <h1 className={PAGE_TITLE}>{cat.label}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {cat.articles.length} article{cat.articles.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className={CARD}>
        <div className={CARD_HEADER}>
          <h2 className={CARD_TITLE}>Articles</h2>
        </div>
        <ul className="divide-y">
          {cat.articles.map((article) => (
            <li key={article.slug}>
              <Link
                href={`/help/${cat.slug}/${article.slug}`}
                className="flex items-start gap-3 px-5 py-4 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">
                    {article.title}
                  </p>
                  {article.summary && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {article.summary}
                    </p>
                  )}
                  {article.estimatedReadingTime && (
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {article.estimatedReadingTime} min read
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              </Link>
            </li>
          ))}
          {cat.articles.length === 0 && (
            <li className="px-5 py-8 text-sm text-muted-foreground text-center">
              No articles in this category yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
