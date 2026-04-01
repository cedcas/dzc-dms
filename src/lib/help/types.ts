export interface ArticleMeta {
  title: string;
  slug: string;
  summary: string;
  category: string;
  order: number;
  lastUpdated: string;
  audience?: string;
  estimatedReadingTime?: number;
  relatedArticles?: string[];
}

export interface Article extends ArticleMeta {
  content: string;
}

export interface HelpCategory {
  slug: string;
  label: string;
  order: number;
  articles: ArticleMeta[];
}
