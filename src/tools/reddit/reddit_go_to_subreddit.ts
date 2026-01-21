import type {ToolDefinition} from 'webmcp-polyfill';

export const redditGoToSubreddit: ToolDefinition = {
  name: 'reddit_go_to_subreddit',
  description:
    'Navigate to a specific subreddit by name. After navigation, use reddit_get_feed_posts to retrieve the posts.',
  inputSchema: {
    type: 'object',
    properties: {
      subreddit: {
        type: 'string',
        description:
          'The subreddit name (with or without "r/" prefix, e.g., "technology" or "r/technology")'
      }
    },
    required: ['subreddit']
  },
  async execute(input) {
    const {subreddit} = input as {subreddit: string};

    // Normalize subreddit name - remove r/ prefix if present
    const normalizedName = subreddit.replace(/^r\//, '').trim();

    if (!normalizedName) {
      return {
        content: [
          {
            type: 'text',
            text: 'Invalid subreddit name provided.'
          }
        ],
        isError: true
      };
    }

    // Navigate to the subreddit
    window.location.href = `https://www.reddit.com/r/${normalizedName}/`;

    return {
      content: [
        {
          type: 'text',
          text: `Navigating to r/${normalizedName}. Use reddit_get_feed_posts to retrieve posts after the page loads.`
        }
      ]
    };
  }
};
