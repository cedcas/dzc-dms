import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Article, ArticleMeta, HelpCategory } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content/help");

export const CATEGORY_LABELS: Record<string, { label: string; order: number }> = {
  "getting-started":        { label: "Getting Started",          order: 1 },
  "dashboard":              { label: "Dashboard",                order: 2 },
  "clients":                { label: "Clients",                  order: 3 },
  "debt-accounts":          { label: "Debt Accounts",            order: 4 },
  "negotiation-activities": { label: "Negotiation Activities",   order: 5 },
  "offers":                 { label: "Offers",                   order: 6 },
  "tasks":                  { label: "Tasks & Follow-Ups",       order: 7 },
  "documents":              { label: "Documents",                order: 8 },
  "reporting":              { label: "Reporting",                order: 9 },
  "troubleshooting":        { label: "Troubleshooting / FAQ",    order: 10 },
};

function getArticleMeta(categorySlug: string, filename: string): ArticleMeta | null {
  const filePath = path.join(CONTENT_DIR, categorySlug, filename);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = matter(raw);

  return {
    title: data.title ?? "Untitled",
    slug: data.slug ?? filename.replace(/\.mdx?$/, ""),
    summary: data.summary ?? "",
    category: categorySlug,
    order: data.order ?? 99,
    lastUpdated: data.lastUpdated ?? "",
    audience: data.audience,
    estimatedReadingTime: data.estimatedReadingTime,
    relatedArticles: data.relatedArticles,
  };
}

export function getCategories(): HelpCategory[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const categoryDirs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  return categoryDirs
    .map((slug) => {
      const meta = CATEGORY_LABELS[slug];
      const dirPath = path.join(CONTENT_DIR, slug);
      const files = fs
        .readdirSync(dirPath)
        .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

      const articles = files
        .map((f) => getArticleMeta(slug, f))
        .filter((a): a is ArticleMeta => a !== null)
        .sort((a, b) => a.order - b.order);

      return {
        slug,
        label: meta?.label ?? slug,
        order: meta?.order ?? 99,
        articles,
      };
    })
    .sort((a, b) => a.order - b.order);
}

export function getCategoryBySlug(slug: string): HelpCategory | null {
  const categories = getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getArticle(
  categorySlug: string,
  articleSlug: string
): Promise<Article | null> {
  const dirPath = path.join(CONTENT_DIR, categorySlug);
  if (!fs.existsSync(dirPath)) return null;

  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const filename = files.find((f) => {
    const filePath = path.join(dirPath, f);
    const raw = fs.readFileSync(filePath, "utf8");
    const { data } = matter(raw);
    return (data.slug ?? f.replace(/\.mdx?$/, "")) === articleSlug;
  });

  if (!filename) return null;

  const filePath = path.join(dirPath, filename);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  return {
    title: data.title ?? "Untitled",
    slug: data.slug ?? filename.replace(/\.mdx?$/, ""),
    summary: data.summary ?? "",
    category: categorySlug,
    order: data.order ?? 99,
    lastUpdated: data.lastUpdated ?? "",
    audience: data.audience,
    estimatedReadingTime: data.estimatedReadingTime,
    relatedArticles: data.relatedArticles,
    content,
  };
}
