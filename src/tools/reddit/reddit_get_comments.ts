import type {ToolDefinition} from 'webmcp-polyfill';

interface Comment {
  index: number;
  id: string;
  author: string;
  score: number | null;
  depth: number;
  text: string;
}

export const redditGetComments: ToolDefinition = {
  name: 'reddit_get_comments',
  description:
    'Extract comments from the current Reddit post page. Returns comment authors, scores, depth (for threading), and text content.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description:
          'Maximum number of comments to return (default: 15, max: 50)'
      },
      maxDepth: {
        type: 'number',
        description:
          'Maximum reply depth to include (default: 3). Use 0 for top-level comments only.'
      }
    }
  },
  async execute(input) {
    const {limit = 15, maxDepth = 3} = input as {
      limit?: number;
      maxDepth?: number;
    };
    const maxComments = Math.min(limit, 50);

    // Check if we're on a post page
    const isPostPage = window.location.pathname.includes('/comments/');
    if (!isPostPage) {
      return {
        content: [
          {
            type: 'text',
            text: 'Not on a post page. Use reddit_click_post to navigate to a post first.'
          }
        ],
        isError: true
      };
    }

    const commentElements = document.querySelectorAll('shreddit-comment');

    if (commentElements.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No comments found on this post.'
          }
        ],
        structuredContent: {
          commentCount: 0,
          comments: []
        }
      };
    }

    const comments: Comment[] = [];

    commentElements.forEach((comment) => {
      if (comments.length >= maxComments) return;

      const depthAttr = comment.getAttribute('depth');
      const depth = depthAttr ? parseInt(depthAttr, 10) : 0;

      // Filter by depth
      if (depth > maxDepth) return;

      const thingId = comment.getAttribute('thingid') || '';
      const author = comment.getAttribute('author') || '[deleted]';
      const scoreAttr = comment.getAttribute('score');

      // Extract comment text from paragraphs
      const paragraphs = comment.querySelectorAll('p');
      let text = '';
      if (paragraphs.length > 0) {
        text = Array.from(paragraphs)
          .map((p) => p.textContent?.trim())
          .filter(Boolean)
          .join(' ');
      }

      // Skip if no text content
      if (!text) return;

      comments.push({
        index: comments.length + 1,
        id: thingId,
        author,
        score: scoreAttr ? parseInt(scoreAttr, 10) : null,
        depth,
        text: text.substring(0, 500) + (text.length > 500 ? '...' : '')
      });
    });

    // Format output with indentation for depth
    const formatComment = (c: Comment): string => {
      const indent = '  '.repeat(c.depth);
      return `${indent}${c.index}. u/${c.author} (${c.score ?? '?'} points):\n${indent}   ${c.text.substring(0, 200)}${c.text.length > 200 ? '...' : ''}`;
    };

    return {
      content: [
        {
          type: 'text',
          text: `Found ${comments.length} comments:\n\n${comments.map(formatComment).join('\n\n')}`
        }
      ],
      structuredContent: {
        commentCount: comments.length,
        totalOnPage: commentElements.length,
        comments
      }
    };
  }
};
