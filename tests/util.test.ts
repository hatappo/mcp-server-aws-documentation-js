import { describe, it, expect } from 'vitest';
import { isHtmlContent, formatDocumentationResult, parseRecommendationResults } from '../src/util.js';

describe('util functions', () => {
  describe('isHtmlContent', () => {
    it('should detect HTML content', () => {
      expect(isHtmlContent('<html><body>test</body></html>', 'text/html')).toBe(true);
      expect(isHtmlContent('plain text', 'text/plain')).toBe(false);
      expect(isHtmlContent('<html>test', 'text/html')).toBe(true);
      expect(isHtmlContent('test', '')).toBe(true); // empty content type defaults to HTML
    });
  });

  describe('formatDocumentationResult', () => {
    it('should format documentation with truncation', () => {
      const url = 'https://docs.aws.amazon.com/test.html';
      const content = 'This is a test content that is longer than expected';
      const result = formatDocumentationResult(url, content, 0, 20);
      
      expect(result).toContain('AWS Documentation from');
      expect(result).toContain(url);
      expect(result).toContain('This is a test conte');
      expect(result).toContain('Content truncated');
    });

    it('should handle content that does not need truncation', () => {
      const url = 'https://docs.aws.amazon.com/test.html';
      const content = 'Short content';
      const result = formatDocumentationResult(url, content, 0, 100);
      
      expect(result).toContain('AWS Documentation from');
      expect(result).toContain(url);
      expect(result).toContain('Short content');
      expect(result).not.toContain('Content truncated');
    });

    it('should handle start index beyond content length', () => {
      const url = 'https://docs.aws.amazon.com/test.html';
      const content = 'Short';
      const result = formatDocumentationResult(url, content, 10, 100);
      
      expect(result).toContain('No more content available');
    });
  });

  describe('parseRecommendationResults', () => {
    it('should parse highly rated recommendations', () => {
      const data = {
        highlyRated: {
          items: [
            {
              url: 'https://docs.aws.amazon.com/test1.html',
              assetTitle: 'Test Title 1',
              abstract: 'Test abstract 1'
            },
            {
              url: 'https://docs.aws.amazon.com/test2.html',
              assetTitle: 'Test Title 2',
              abstract: 'Test abstract 2'
            }
          ]
        }
      };

      const results = parseRecommendationResults(data);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        url: 'https://docs.aws.amazon.com/test1.html',
        title: 'Test Title 1',
        context: 'Test abstract 1'
      });
      expect(results[1]).toEqual({
        url: 'https://docs.aws.amazon.com/test2.html',
        title: 'Test Title 2',
        context: 'Test abstract 2'
      });
    });

    it('should parse journey recommendations', () => {
      const data = {
        journey: {
          items: [
            {
              intent: 'Getting Started',
              urls: [
                {
                  url: 'https://docs.aws.amazon.com/journey1.html',
                  assetTitle: 'Journey Title 1'
                }
              ]
            }
          ]
        }
      };

      const results = parseRecommendationResults(data);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        url: 'https://docs.aws.amazon.com/journey1.html',
        title: 'Journey Title 1',
        context: 'Intent: Getting Started'
      });
    });

    it('should parse new content recommendations', () => {
      const data = {
        new: {
          items: [
            {
              url: 'https://docs.aws.amazon.com/new1.html',
              assetTitle: 'New Title 1',
              dateCreated: '2023-12-01'
            }
          ]
        }
      };

      const results = parseRecommendationResults(data);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        url: 'https://docs.aws.amazon.com/new1.html',
        title: 'New Title 1',
        context: 'New content added on 2023-12-01'
      });
    });

    it('should parse similar content recommendations', () => {
      const data = {
        similar: {
          items: [
            {
              url: 'https://docs.aws.amazon.com/similar1.html',
              assetTitle: 'Similar Title 1',
              abstract: 'Similar abstract 1'
            }
          ]
        }
      };

      const results = parseRecommendationResults(data);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        url: 'https://docs.aws.amazon.com/similar1.html',
        title: 'Similar Title 1',
        context: 'Similar abstract 1'
      });
    });

    it('should handle empty or invalid data', () => {
      expect(parseRecommendationResults({})).toEqual([]);
      expect(parseRecommendationResults(null)).toEqual([]);
      expect(parseRecommendationResults(undefined)).toEqual([]);
      expect(parseRecommendationResults('invalid')).toEqual([]);
    });
  });
});