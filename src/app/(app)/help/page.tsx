import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { getCategories } from "@/lib/help/loader";
import { CARD, CARD_HEADER, CARD_TITLE, PAGE_TITLE, PAGE_SUBTITLE } from "@/lib/ui-classes";

export const metadata = { title: "Help Center — DZC DMS" };

export default function HelpHomePage() {
  const categories = getCategories();

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <BookOpen className="h-7 w-7 text-primary mt-0.5 shrink-0" />
        <div>
          <h1 className={PAGE_TITLE}>Help Center</h1>
          <p className={PAGE_SUBTITLE}>
            How-to guides, feature explanations, and troubleshooting for DMS.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category.slug} className={CARD}>
            <div className={CARD_HEADER}>
              <h2 className={CARD_TITLE}>{category.label}</h2>
              <span className="text-xs text-muted-foreground">
                {category.articles.length} article{category.articles.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ul className="divide-y">
              {category.articles.map((article) => (
                <li key={article.slug}>
                  <Link
                    href={`/help/${category.slug}/${article.slug}`}
                    className="flex items-center gap-2 px-5 py-3 text-sm hover:bg-muted/40 transition-colors group"
                  >
                    <span className="flex-1 font-medium group-hover:text-primary transition-colors">
                      {article.title}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
              {category.articles.length === 0 && (
                <li className="px-5 py-4 text-sm text-muted-foreground">
                  No articles yet.
                </li>
              )}
            </ul>
            <div className="px-5 py-3 border-t">
              <Link
                href={`/help/${category.slug}`}
                className="text-xs text-primary hover:underline underline-offset-2"
              >
                View all in {category.label} →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
