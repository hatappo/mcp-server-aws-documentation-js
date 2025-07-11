import * as cheerio from "cheerio";
import TurndownService from "turndown";
import type { RecommendationResult } from "./models.js";

export function extractContentFromHtml(html: string): string {
  if (!html) {
    return "<e>Empty HTML content</e>";
  }

  try {
    const $ = cheerio.load(html);

    let mainContent: cheerio.Cheerio<any> | null = null;

    const contentSelectors = [
      "main",
      "article",
      "#main-content",
      ".main-content",
      "#content",
      ".content",
      "div[role='main']",
      "#awsdocs-content",
      ".awsui-article",
    ];

    for (const selector of contentSelectors) {
      const content = $(selector);
      if (content.length > 0) {
        mainContent = content;
        break;
      }
    }

    if (!mainContent) {
      mainContent = $("body").length > 0 ? $("body") : $.root();
    }

    const navSelectors = [
      "noscript",
      ".prev-next",
      "#main-col-footer",
      ".awsdocs-page-utilities",
      "#quick-feedback-yes",
      "#quick-feedback-no",
      ".page-loading-indicator",
      "#tools-panel",
      ".doc-cookie-banner",
      "awsdocs-copyright",
      "awsdocs-thumb-feedback",
    ];

    for (const selector of navSelectors) {
      mainContent.find(selector).remove();
    }

    const tagsToRemove = [
      "script",
      "style",
      "noscript",
      "meta",
      "link",
      "footer",
      "nav",
      "aside",
      "header",
      "awsdocs-cookie-consent-container",
      "awsdocs-feedback-container",
      "awsdocs-page-header",
      "awsdocs-page-header-container",
      "awsdocs-filter-selector",
      "awsdocs-breadcrumb-container",
      "awsdocs-page-footer",
      "awsdocs-page-footer-container",
      "awsdocs-footer",
      "awsdocs-cookie-banner",
      "js-show-more-buttons",
      "js-show-more-text",
      "feedback-container",
      "feedback-section",
      "doc-feedback-container",
      "doc-feedback-section",
      "warning-container",
      "warning-section",
      "cookie-banner",
      "cookie-notice",
      "copyright-section",
      "legal-section",
      "terms-section",
    ];

    for (const tag of tagsToRemove) {
      mainContent.find(tag).remove();
    }

    const turndownService = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
    });

    const content = turndownService.turndown(mainContent.html() || "");

    if (!content) {
      return "<e>Page failed to be simplified from HTML</e>";
    }

    return content;
  } catch (e) {
    return `<e>Error converting HTML to Markdown: ${e}</e>`;
  }
}

export function isHtmlContent(pageRaw: string, contentType: string): boolean {
  return pageRaw.slice(0, 100).includes("<html") || contentType.includes("text/html") || !contentType;
}

export function formatDocumentationResult(
  url: string,
  content: string,
  startIndex: number,
  maxLength: number,
): string {
  const originalLength = content.length;

  if (startIndex >= originalLength) {
    return `AWS Documentation from ${url}:\n\n<e>No more content available.</e>`;
  }

  const endIndex = Math.min(startIndex + maxLength, originalLength);
  const truncatedContent = content.slice(startIndex, endIndex);

  if (!truncatedContent) {
    return `AWS Documentation from ${url}:\n\n<e>No more content available.</e>`;
  }

  const actualContentLength = truncatedContent.length;
  const remainingContent = originalLength - (startIndex + actualContentLength);

  let result = `AWS Documentation from ${url}:\n\n${truncatedContent}`;

  if (remainingContent > 0) {
    const nextStart = startIndex + actualContentLength;
    result += `\n\n<e>Content truncated. Call the read_documentation tool with start_index=${nextStart} to get more content.</e>`;
  }

  return result;
}

export function parseRecommendationResults(data: unknown): RecommendationResult[] {
  const results: RecommendationResult[] = [];

  if (typeof data === 'object' && data !== null) {
    const typedData = data as Record<string, any>;
    if (typedData.highlyRated?.items) {
      for (const item of typedData.highlyRated.items) {
        const context = item.abstract || undefined;
        results.push({
          url: item.url || "",
          title: item.assetTitle || "",
          context,
        });
      }
    }

    if (typedData.journey?.items) {
      for (const intentGroup of typedData.journey.items) {
        const intent = intentGroup.intent || "";
        if (intentGroup.urls) {
          for (const urlItem of intentGroup.urls) {
            const context = intent ? `Intent: ${intent}` : undefined;
            results.push({
              url: urlItem.url || "",
              title: urlItem.assetTitle || "",
              context,
            });
          }
        }
      }
    }

    if (typedData.new?.items) {
      for (const item of typedData.new.items) {
        const dateCreated = item.dateCreated || "";
        const context = dateCreated ? `New content added on ${dateCreated}` : "New content";
        results.push({
          url: item.url || "",
          title: item.assetTitle || "",
          context,
        });
      }
    }

    if (typedData.similar?.items) {
      for (const item of typedData.similar.items) {
        const context = item.abstract || "Similar content";
        results.push({
          url: item.url || "",
          title: item.assetTitle || "",
          context,
        });
      }
    }
  }

  return results;
}