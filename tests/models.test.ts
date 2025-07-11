import { describe, it, expect } from 'vitest';
import type { SearchResult, RecommendationResult } from '../src/models.js';

describe('models', () => {
  describe('SearchResult', () => {
    it('should accept valid SearchResult object', () => {
      const searchResult: SearchResult = {
        rank_order: 1,
        url: 'https://docs.aws.amazon.com/test.html',
        title: 'Test Title',
        context: 'Test context'
      };

      expect(searchResult.rank_order).toBe(1);
      expect(searchResult.url).toBe('https://docs.aws.amazon.com/test.html');
      expect(searchResult.title).toBe('Test Title');
      expect(searchResult.context).toBe('Test context');
    });

    it('should accept SearchResult without context', () => {
      const searchResult: SearchResult = {
        rank_order: 1,
        url: 'https://docs.aws.amazon.com/test.html',
        title: 'Test Title'
      };

      expect(searchResult.rank_order).toBe(1);
      expect(searchResult.url).toBe('https://docs.aws.amazon.com/test.html');
      expect(searchResult.title).toBe('Test Title');
      expect(searchResult.context).toBeUndefined();
    });
  });

  describe('RecommendationResult', () => {
    it('should accept valid RecommendationResult object', () => {
      const recommendationResult: RecommendationResult = {
        url: 'https://docs.aws.amazon.com/test.html',
        title: 'Test Title',
        context: 'Test context'
      };

      expect(recommendationResult.url).toBe('https://docs.aws.amazon.com/test.html');
      expect(recommendationResult.title).toBe('Test Title');
      expect(recommendationResult.context).toBe('Test context');
    });

    it('should accept RecommendationResult without context', () => {
      const recommendationResult: RecommendationResult = {
        url: 'https://docs.aws.amazon.com/test.html',
        title: 'Test Title'
      };

      expect(recommendationResult.url).toBe('https://docs.aws.amazon.com/test.html');
      expect(recommendationResult.title).toBe('Test Title');
      expect(recommendationResult.context).toBeUndefined();
    });
  });
});