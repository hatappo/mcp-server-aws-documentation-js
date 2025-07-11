import { extractContentFromHtml, formatDocumentationResult, isHtmlContent } from "./util.js";

const VERSION = "1.1.1";
export const DEFAULT_USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 ModelContextProtocol/${VERSION} (AWS Documentation Server)`;

export async function readDocumentationImpl(
  urlStr: string,
  maxLength: number,
  startIndex: number,
  sessionUuid: string,
): Promise<string> {
  console.debug(`Fetching documentation from ${urlStr}`);

  const urlWithSession = `${urlStr}?session=${sessionUuid}`;

  try {
    const response = await fetch(urlWithSession, {
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        "X-MCP-Session-Id": sessionUuid,
      },
      redirect: "follow",
    });

    if (!response.ok) {
      const errorMsg = `Failed to fetch ${urlStr} - status code ${response.status}`;
      console.error(errorMsg);
      return errorMsg;
    }

    const pageRaw = await response.text();
    const contentType = response.headers.get("content-type") || "";

    let content: string;
    if (isHtmlContent(pageRaw, contentType)) {
      content = extractContentFromHtml(pageRaw);
    } else {
      content = pageRaw;
    }

    const result = formatDocumentationResult(urlStr, content, startIndex, maxLength);

    if (content.length > startIndex + maxLength) {
      console.debug(`Content truncated at ${startIndex + maxLength} of ${content.length} characters`);
    }

    return result;
  } catch (e) {
    const errorMsg = `Failed to fetch ${urlStr}: ${e}`;
    console.error(errorMsg);
    return errorMsg;
  }
}