export interface SearchResult {
  rank_order: number;
  url: string;
  title: string;
  context?: string;
}

export interface RecommendationResult {
  url: string;
  title: string;
  context?: string;
}