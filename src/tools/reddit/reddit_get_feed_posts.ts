import type {ToolDefinition} from 'webmcp-polyfill';

interface FeedPost {
  index: number;
  id: string;
  title: string;
  subreddit: string;
  author: string;
  score: number | null;
  commentCount: number | null;
  permalink: string;
  postType: string;
  createdTimestamp: string | null;
}

export const redditGetFeedPosts: ToolDefinition = {
  name: 'reddit_get_feed_posts',
  description:
    'Extract posts from the current Reddit feed (homepage or subreddit). Returns post titles, subreddits, scores, comment counts, and permalinks.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of posts to return (default: 10, max: 25)'
      }
    }
  },
  async execute(input) {
    const {limit = 10} = input as {limit?: number};
    const maxPosts = Math.min(limit, 25);

    const postElements = document.querySelectorAll('shreddit-post');

    if (postElements.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No posts found on this page. Make sure you are on a Reddit feed page.'
          }
        ],
        isError: true
      };
    }

    const posts: FeedPost[] = [];

    postElements.forEach((post, index) => {
      if (index >= maxPosts) return;

      const id = post.id || post.getAttribute('id') || '';
      const title = post.getAttribute('post-title') || '';
      const subreddit = post.getAttribute('subreddit-prefixed-name') || '';
      const author = post.getAttribute('author') || '';
      const scoreAttr = post.getAttribute('score');
      const commentCountAttr = post.getAttribute('comment-count');
      const permalink = post.getAttribute('permalink') || '';
      const postType = post.getAttribute('post-type') || '';
      const createdTimestamp = post.getAttribute('created-timestamp');

      posts.push({
        index: index + 1,
        id,
        title,
        subreddit,
        author,
        score: scoreAttr ? parseInt(scoreAttr, 10) : null,
        commentCount: commentCountAttr ? parseInt(commentCountAttr, 10) : null,
        permalink,
        postType,
        createdTimestamp
      });
    });

    // Determine current context
    const pathMatch = window.location.pathname.match(/^\/r\/([^/]+)/);
    const currentSubreddit = pathMatch ? `r/${pathMatch[1]}` : 'homepage';

    return {
      content: [
        {
          type: 'text',
          text: `Found ${posts.length} posts on ${currentSubreddit}:\n\n${posts
            .map(
              (p) =>
                `${p.index}. [${p.subreddit}] ${p.title}\n   Score: ${p.score ?? 'N/A'} | Comments: ${p.commentCount ?? 'N/A'} | Type: ${p.postType}`
            )
            .join('\n\n')}`
        }
      ],
      structuredContent: {
        context: currentSubreddit,
        postCount: posts.length,
        posts
      }
    };
  }
};
