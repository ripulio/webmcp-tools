import type {ToolDefinition} from 'webmcp-polyfill';

interface SearchResult {
  index: number;
  id: string;
  title: string;
  subreddit: string;
  author: string;
  score: number | null;
  commentCount: number | null;
  permalink: string;
  textPreview: string | null;
}

export const redditGetSearchResults: ToolDefinition = {
  name: 'reddit_get_search_results',
  description:
    'Extract search results from a Reddit search results page. Returns post titles, subreddits, scores, and permalinks. Must be called after reddit_search when on a search results page.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description:
          'Maximum number of results to return (default: 10, max: 25)'
      }
    }
  },
  async execute(input) {
    const {limit = 10} = input as {limit?: number};
    const maxResults = Math.min(limit, 25);

    // Check if we're on a search page
    if (!window.location.pathname.startsWith('/search')) {
      return {
        content: [
          {
            type: 'text',
            text: 'Not on a search results page. Use reddit_search first to perform a search.'
          }
        ],
        isError: true
      };
    }

    // Search results use search-telemetry-tracker elements
    const resultContainers = document.querySelectorAll(
      '#main-content search-telemetry-tracker[view-events*="search/view"]'
    );

    if (resultContainers.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No search results found on this page.'
          }
        ],
        isError: true
      };
    }

    const results: SearchResult[] = [];

    resultContainers.forEach((container, index) => {
      if (index >= maxResults) return;

      // Find the title link
      const titleLink = container.querySelector<HTMLAnchorElement>(
        'a[id^="search-post-title-"]'
      );
      // Subreddit link is in the post-credit-row, not the title area
      const creditRow = container.querySelector('.post-credit-row');
      const subredditLink =
        creditRow?.querySelector<HTMLAnchorElement>('a[href^="/r/"]');
      const textPreviewLink = container.querySelector<HTMLAnchorElement>(
        'a.text-neutral-content-strong'
      );

      if (!titleLink) return;

      const id = titleLink.id.replace('search-post-title-', '');
      const title = titleLink.textContent?.trim() || '';
      const subreddit = subredditLink?.textContent?.trim() || '';
      const permalink = titleLink.getAttribute('href') || '';
      const textPreview = textPreviewLink?.textContent?.trim() || null;

      // Try to find score and comment count from the container
      const statsText = container.textContent || '';
      const scoreMatch = statsText.match(
        /(\d+(?:,\d+)?(?:\.\d+)?[kKmM]?)\s*(?:upvotes?|points?)/i
      );
      const commentMatch = statsText.match(/(\d+(?:,\d+)?)\s*comments?/i);

      results.push({
        index: index + 1,
        id,
        title,
        subreddit,
        author: '',
        score: scoreMatch ? parseFloat(scoreMatch[1].replace(/,/g, '')) : null,
        commentCount: commentMatch
          ? parseInt(commentMatch[1].replace(/,/g, ''), 10)
          : null,
        permalink,
        textPreview
      });
    });

    // Get query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} search results for "${query}":\n\n${results
            .map(
              (r) =>
                `${r.index}. [${r.subreddit}] ${r.title}${r.textPreview ? `\n   Preview: ${r.textPreview.substring(0, 100)}...` : ''}`
            )
            .join('\n\n')}`
        }
      ],
      structuredContent: {
        query,
        resultCount: results.length,
        results
      }
    };
  }
};
