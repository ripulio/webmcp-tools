import type {ToolDefinition} from 'webmcp-polyfill';

interface PostDetails {
  [key: string]: unknown;
  id: string;
  title: string;
  subreddit: string;
  author: string;
  score: number | null;
  commentCount: number | null;
  postType: string;
  contentUrl: string | null;
  textContent: string | null;
  createdTimestamp: string | null;
  permalink: string;
}

export const redditGetPostDetails: ToolDefinition = {
  name: 'reddit_get_post_details',
  description:
    'Extract detailed information about the current post on a Reddit post page. Returns title, author, score, content, and metadata.',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  async execute() {
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

    const post = document.querySelector('shreddit-post');
    if (!post) {
      return {
        content: [
          {
            type: 'text',
            text: 'Post element not found on this page.'
          }
        ],
        isError: true
      };
    }

    // Extract post metadata
    const id = post.id || post.getAttribute('id') || '';
    const title = post.getAttribute('post-title') || '';
    const subreddit = post.getAttribute('subreddit-prefixed-name') || '';
    const author = post.getAttribute('author') || '';
    const scoreAttr = post.getAttribute('score');
    const commentCountAttr = post.getAttribute('comment-count');
    const postType = post.getAttribute('post-type') || '';
    const contentUrl = post.getAttribute('content-href');
    const createdTimestamp = post.getAttribute('created-timestamp');
    const permalink =
      post.getAttribute('permalink') || window.location.pathname;

    // Extract text content if present
    let textContent: string | null = null;
    const textBody = post.querySelector('[slot="text-body"]');
    if (textBody) {
      textContent = textBody.textContent?.trim() || null;
    } else {
      // Try to find text in paragraph elements within the post
      const paragraphs = post.querySelectorAll('p');
      if (paragraphs.length > 0) {
        textContent = Array.from(paragraphs)
          .map((p) => p.textContent?.trim())
          .filter(Boolean)
          .join('\n\n');
      }
    }

    const details: PostDetails = {
      id,
      title,
      subreddit,
      author,
      score: scoreAttr ? parseInt(scoreAttr, 10) : null,
      commentCount: commentCountAttr ? parseInt(commentCountAttr, 10) : null,
      postType,
      contentUrl,
      textContent,
      createdTimestamp,
      permalink
    };

    // Format output
    let textOutput = `Post Details:\n\n`;
    textOutput += `Title: ${details.title}\n`;
    textOutput += `Subreddit: ${details.subreddit}\n`;
    textOutput += `Author: u/${details.author}\n`;
    textOutput += `Score: ${details.score ?? 'N/A'}\n`;
    textOutput += `Comments: ${details.commentCount ?? 'N/A'}\n`;
    textOutput += `Type: ${details.postType}\n`;

    if (details.contentUrl) {
      textOutput += `\nLink: ${details.contentUrl}\n`;
    }

    if (details.textContent) {
      textOutput += `\nContent:\n${details.textContent.substring(0, 1000)}${details.textContent.length > 1000 ? '...' : ''}\n`;
    }

    return {
      content: [
        {
          type: 'text',
          text: textOutput
        }
      ],
      structuredContent: details
    };
  }
};
