import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { v4 as uuidv4 } from "uuid";
import type { RecommendationResult, SearchResult } from "./models.js";
import { DEFAULT_USER_AGENT, readDocumentationImpl } from "./server-utils.js";
import { parseRecommendationResults } from "./util.js";

const SEARCH_API_URL = "https://proxy.search.docs.aws.amazon.com/search";
const RECOMMENDATIONS_API_URL = "https://contentrecs-api.docs.aws.amazon.com/v1/recommendations";
const SESSION_UUID = uuidv4();

const server = new Server(
  {
    name: "awslabs.aws-documentation-mcp-server",
    version: "1.1.1",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read_documentation",
        description: "Fetch and convert an AWS documentation page to markdown format.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL of the AWS documentation page to read",
            },
            max_length: {
              type: "number",
              description: "Maximum number of characters to return.",
              default: 5000,
              minimum: 1,
              maximum: 999999,
            },
            start_index: {
              type: "number",
              description:
                "On return output starting at this character index, useful if a previous fetch was truncated and more content is required.",
              default: 0,
              minimum: 0,
            },
          },
          required: ["url"],
        },
      },
      {
        name: "search_documentation",
        description: "Search AWS documentation using the official AWS Documentation Search API.",
        inputSchema: {
          type: "object",
          properties: {
            search_phrase: {
              type: "string",
              description: "Search phrase to use",
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return",
              default: 10,
              minimum: 1,
              maximum: 50,
            },
          },
          required: ["search_phrase"],
        },
      },
      {
        name: "recommend",
        description: "Get content recommendations for an AWS documentation page.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL of the AWS documentation page to get recommendations for",
            },
          },
          required: ["url"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "read_documentation": {
      const url = args?.url as string;
      const maxLength = (args?.max_length as number) || 5000;
      const startIndex = (args?.start_index as number) || 0;

      if (!url.match(/^https?:\/\/docs\.aws\.amazon\.com\//)) {
        throw new Error("URL must be from the docs.aws.amazon.com domain");
      }
      if (!url.endsWith(".html")) {
        throw new Error("URL must end with .html");
      }

      const content = await readDocumentationImpl(url, maxLength, startIndex, SESSION_UUID);

      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    }

    case "search_documentation": {
      const searchPhrase = args?.search_phrase as string;
      const limit = (args?.limit as number) || 10;

      console.debug(`Searching AWS documentation for: ${searchPhrase}`);

      const requestBody = {
        textQuery: {
          input: searchPhrase,
        },
        contextAttributes: [{ key: "domain", value: "docs.aws.amazon.com" }],
        acceptSuggestionBody: "RawText",
        locales: ["en_us"],
      };

      const searchUrlWithSession = `${SEARCH_API_URL}?session=${SESSION_UUID}`;

      try {
        const response = await fetch(searchUrlWithSession, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": DEFAULT_USER_AGENT,
            "X-MCP-Session-Id": SESSION_UUID,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorMsg = `Error searching AWS docs - status code ${response.status}`;
          console.error(errorMsg);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify([
                  {
                    rank_order: 1,
                    url: "",
                    title: errorMsg,
                    context: null,
                  },
                ]),
              },
            ],
          };
        }

        const data = await response.json();
        const results: SearchResult[] = [];

        if (data.suggestions) {
          for (let i = 0; i < Math.min(data.suggestions.length, limit); i++) {
            const suggestion = data.suggestions[i];
            if (suggestion.textExcerptSuggestion) {
              const textSuggestion = suggestion.textExcerptSuggestion;
              let context = null;

              if (textSuggestion.summary) {
                context = textSuggestion.summary;
              } else if (textSuggestion.suggestionBody) {
                context = textSuggestion.suggestionBody;
              }

              results.push({
                rank_order: i + 1,
                url: textSuggestion.link || "",
                title: textSuggestion.title || "",
                context,
              });
            }
          }
        }

        console.debug(`Found ${results.length} search results for: ${searchPhrase}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results),
            },
          ],
        };
      } catch (e) {
        const errorMsg = `Error searching AWS docs: ${e}`;
        console.error(errorMsg);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify([
                {
                  rank_order: 1,
                  url: "",
                  title: errorMsg,
                  context: null,
                },
              ]),
            },
          ],
        };
      }
    }

    case "recommend": {
      const url = args?.url as string;
      console.debug(`Getting recommendations for: ${url}`);

      const recommendationUrl = `${RECOMMENDATIONS_API_URL}?path=${url}&session=${SESSION_UUID}`;

      try {
        const response = await fetch(recommendationUrl, {
          headers: {
            "User-Agent": DEFAULT_USER_AGENT,
          },
        });

        if (!response.ok) {
          const errorMsg = `Error getting recommendations - status code ${response.status}`;
          console.error(errorMsg);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify([
                  {
                    url: "",
                    title: errorMsg,
                    context: null,
                  },
                ]),
              },
            ],
          };
        }

        const data = await response.json();
        const results: RecommendationResult[] = parseRecommendationResults(data);

        console.debug(`Found ${results.length} recommendations for: ${url}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results),
            },
          ],
        };
      } catch (e) {
        const errorMsg = `Error getting recommendations: ${e}`;
        console.error(errorMsg);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify([
                {
                  url: "",
                  title: errorMsg,
                  context: null,
                },
              ]),
            },
          ],
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

export async function main() {
  console.info("Starting AWS Documentation MCP Server");
  const transport = new StdioServerTransport();
  await server.connect(transport);
}