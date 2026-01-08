import type {ToolDefinition} from 'webmcp-polyfill';

interface PropertyDetails {
  [key: string]: unknown;
  name: string;
  address: string | null;
  reviewScore: string | null;
  reviewText: string | null;
  reviewCount: string | null;
  description: string | null;
  highlights: string[];
  popularFacilities: string[];
}

export const bookingGetPropertyDetails: ToolDefinition = {
  name: 'booking_get_property_details',
  description:
    'Get detailed information about a property on Booking.com including name, address, review score, description, highlights, and facilities. Use this after navigating to a property page.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Get property name
    const propertyNameEl = document.querySelector<HTMLElement>(
      'h2.d2fee87262, h2.pp-header__title, h2#hp_hotel_name'
    );

    if (!propertyNameEl) {
      return {
        content: [
          {
            type: 'text',
            text: 'Property name not found. Make sure you are on a Booking.com property page.'
          }
        ],
        isError: true
      };
    }

    const propertyName = propertyNameEl.textContent?.trim() || 'Unknown';

    // Get address
    const addressEl = document.querySelector<HTMLElement>(
      '[data-node_tt_id="location_score_tooltip"], span.hp_address_subtitle'
    );
    const address = addressEl?.textContent?.trim() || null;

    // Get review score
    const reviewScoreEl = document.querySelector(
      '[data-testid="review-score-component"]'
    );
    let reviewScore: string | null = null;
    let reviewText: string | null = null;
    let reviewCount: string | null = null;

    if (reviewScoreEl) {
      const scoreText = reviewScoreEl.textContent || '';
      const scoreMatch = scoreText.match(/(\d+\.?\d*)/);
      reviewScore = scoreMatch ? scoreMatch[1] : null;

      const textMatch = scoreText.match(
        /(Superb|Fabulous|Very good|Good|Pleasant|Exceptional)/i
      );
      reviewText = textMatch ? textMatch[1] : null;

      const countMatch = scoreText.match(/([\d,]+)\s*reviews?/i);
      reviewCount = countMatch ? countMatch[1] : null;
    }

    // Get description
    const descriptionEl = document.querySelector<HTMLElement>(
      '[data-testid="property-description"]'
    );
    const description = descriptionEl?.textContent?.trim() || null;

    // Get highlights
    const highlightEls = document.querySelectorAll(
      '[data-testid="property-highlights"] li'
    );
    const highlights = Array.from(highlightEls)
      .map((el) => el.textContent?.trim())
      .filter((text): text is string => !!text);

    // Get popular facilities
    const facilityEls = document.querySelectorAll(
      '[data-testid="property-most-popular-facilities-wrapper"] li'
    );
    const popularFacilities = Array.from(facilityEls)
      .map((el) => el.textContent?.trim())
      .filter((text): text is string => !!text);

    const details: PropertyDetails = {
      name: propertyName,
      address,
      reviewScore,
      reviewText,
      reviewCount,
      description,
      highlights,
      popularFacilities
    };

    // Format output
    let output = `Property: ${details.name}\n`;
    if (details.address) output += `Address: ${details.address}\n`;
    if (details.reviewScore) {
      output += `Rating: ${details.reviewScore}/10`;
      if (details.reviewText) output += ` (${details.reviewText})`;
      if (details.reviewCount) output += ` - ${details.reviewCount} reviews`;
      output += '\n';
    }
    if (details.description) {
      output += `\nDescription:\n${details.description.substring(0, 500)}${details.description.length > 500 ? '...' : ''}\n`;
    }
    if (details.highlights.length > 0) {
      output += `\nHighlights:\n${details.highlights.map((h) => `- ${h}`).join('\n')}\n`;
    }
    if (details.popularFacilities.length > 0) {
      output += `\nPopular Facilities:\n${details.popularFacilities.map((f) => `- ${f}`).join('\n')}\n`;
    }

    return {
      content: [
        {
          type: 'text',
          text: output
        }
      ],
      structuredContent: details
    };
  }
};
