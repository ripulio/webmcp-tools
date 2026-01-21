import type {ToolDefinition} from 'webmcp-polyfill';

type SortOption =
  | 'top_picks'
  | 'price_low'
  | 'price_high'
  | 'rating_high'
  | 'rating_low'
  | 'homes_first'
  | 'top_reviewed'
  | 'distance';

const SORT_OPTIONS: Record<SortOption, string> = {
  top_picks: 'Our top picks',
  price_low: 'Price (lowest first)',
  price_high: 'Price (highest first)',
  rating_high: 'Property rating (high to low)',
  rating_low: 'Property rating (low to high)',
  homes_first: 'Homes & apartments first',
  top_reviewed: 'Top reviewed',
  distance: 'Distance from city centre'
};

export const bookingSortResults: ToolDefinition = {
  name: 'booking_sort_results',
  description:
    'Sort the search results on Booking.com by a specific criteria. Available options: top_picks, price_low, price_high, rating_high, rating_low, homes_first, top_reviewed, distance.',
  inputSchema: {
    type: 'object',
    properties: {
      sortBy: {
        type: 'string',
        enum: Object.keys(SORT_OPTIONS),
        description:
          'Sort option: "top_picks" (default), "price_low", "price_high", "rating_high", "rating_low", "homes_first", "top_reviewed", "distance"'
      }
    },
    required: ['sortBy']
  },
  async execute(input) {
    const {sortBy} = input as {sortBy: SortOption};

    if (!SORT_OPTIONS[sortBy]) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid sort option "${sortBy}". Valid options: ${Object.keys(SORT_OPTIONS).join(', ')}`
          }
        ],
        isError: true
      };
    }

    // Find and click the sort dropdown trigger
    let sortTrigger = document.querySelector<HTMLButtonElement>(
      '[data-testid="sorters-dropdown-trigger"]'
    );

    // Fallback: find button by text content
    if (!sortTrigger) {
      const allButtons = document.querySelectorAll<HTMLButtonElement>('button');
      for (const button of allButtons) {
        if (button.textContent?.trim().startsWith('Sort by:')) {
          sortTrigger = button;
          break;
        }
      }
    }

    if (!sortTrigger) {
      return {
        content: [
          {
            type: 'text',
            text: 'Sort dropdown not found. Make sure you are on a Booking.com search results page.'
          }
        ],
        isError: true
      };
    }

    sortTrigger.click();

    // Wait for dropdown to appear
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Find the sort option button
    const targetText = SORT_OPTIONS[sortBy];
    const sortButtons = document.querySelectorAll<HTMLButtonElement>(
      '[data-testid="sorters-dropdown"] button, [role="listbox"] button'
    );

    let targetButton: HTMLButtonElement | null = null;
    for (const button of sortButtons) {
      if (button.textContent?.trim() === targetText) {
        targetButton = button;
        break;
      }
    }

    if (!targetButton) {
      // Try alternative approach - find by text content
      const allButtons = document.querySelectorAll<HTMLButtonElement>('button');
      for (const button of allButtons) {
        if (button.textContent?.trim() === targetText) {
          targetButton = button;
          break;
        }
      }
    }

    if (!targetButton) {
      // Close dropdown
      document.body.click();
      return {
        content: [
          {
            type: 'text',
            text: `Sort option "${targetText}" not found in dropdown.`
          }
        ],
        isError: true
      };
    }

    targetButton.click();

    return {
      content: [
        {
          type: 'text',
          text: `Sorting results by: ${targetText}. Use booking_get_results to retrieve the sorted results after the page updates.`
        }
      ]
    };
  }
};
