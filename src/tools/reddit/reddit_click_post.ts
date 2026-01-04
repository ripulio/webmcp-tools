import type {ToolDefinition} from 'webmcp-polyfill';

export const redditClickPost: ToolDefinition = {
  name: 'reddit_click_post',
  description:
    'Click on a post to view its full content and comments. Can select by index (from reddit_get_feed_posts) or by post ID.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'The 1-based index of the post to click (from reddit_get_feed_posts results)'
      },
      postId: {
        type: 'string',
        description:
          'The post ID (e.g., "t3_abc123") to click. Takes precedence over index if both provided.'
      }
    }
  },
  async execute(input) {
    const {index, postId} = input as {index?: number; postId?: string};

    if (!index && !postId) {
      return {
        content: [
          {
            type: 'text',
            text: 'Must provide either index or postId to select a post.'
          }
        ],
        isError: true
      };
    }

    let targetPost: Element | null = null;

    if (postId) {
      // Find by post ID
      const normalizedId = postId.startsWith('t3_') ? postId : `t3_${postId}`;
      targetPost = document.querySelector(`shreddit-post#${normalizedId}`);
      if (!targetPost) {
        targetPost = document.querySelector(
          `shreddit-post[id="${normalizedId}"]`
        );
      }
    } else if (index) {
      // Find by index
      const posts = document.querySelectorAll('shreddit-post');
      if (index < 1 || index > posts.length) {
        return {
          content: [
            {
              type: 'text',
              text: `Invalid index ${index}. There are ${posts.length} posts on this page.`
            }
          ],
          isError: true
        };
      }
      targetPost = posts[index - 1];
    }

    if (!targetPost) {
      return {
        content: [
          {
            type: 'text',
            text: `Post not found. Make sure you are on a Reddit feed page with posts.`
          }
        ],
        isError: true
      };
    }

    const postTitle = targetPost.getAttribute('post-title') || 'Unknown';
    const permalink = targetPost.getAttribute('permalink');

    // Find and click the title link or the main post link
    const titleLink = targetPost.querySelector<HTMLAnchorElement>(
      'a[id^="post-title-"]'
    );
    const fullPostLink = targetPost.querySelector<HTMLAnchorElement>(
      'a[slot="full-post-link"]'
    );

    const linkToClick = titleLink || fullPostLink;

    if (!linkToClick) {
      // Fall back to navigating directly if no link found
      if (permalink) {
        window.location.href = `https://www.reddit.com${permalink}`;
        return {
          content: [
            {
              type: 'text',
              text: `Navigating to post: "${postTitle}". Use reddit_get_post_details and reddit_get_comments after the page loads.`
            }
          ]
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: 'Could not find a clickable link for this post.'
          }
        ],
        isError: true
      };
    }

    linkToClick.click();

    return {
      content: [
        {
          type: 'text',
          text: `Clicking on post: "${postTitle}". Use reddit_get_post_details and reddit_get_comments after the page loads.`
        }
      ]
    };
  }
};
