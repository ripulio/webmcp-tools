import type {ToolDefinition} from 'webmcp-polyfill';

type FilterType =
  | 'property_type'
  | 'star_rating'
  | 'review_score'
  | 'facility'
  | 'distance';

const FILTER_MAPPINGS: Record<FilterType, Record<string, string>> = {
  property_type: {
    hotels: 'ht_id=204',
    apartments: 'ht_id=201',
    holiday_homes: 'ht_id=220',
    hostels: 'ht_id=203',
    bed_and_breakfast: 'ht_id=208',
    guest_houses: 'ht_id=216',
    villas: 'ht_id=213'
  },
  star_rating: {
    '1_star': 'class=1',
    '2_stars': 'class=2',
    '3_stars': 'class=3',
    '4_stars': 'class=4',
    '5_stars': 'class=5'
  },
  review_score: {
    superb: 'review_score=90',
    very_good: 'review_score=80',
    good: 'review_score=70',
    pleasant: 'review_score=60'
  },
  facility: {
    free_wifi: 'hotelfacility=107',
    parking: 'hotelfacility=2',
    swimming_pool: 'hotelfacility=433',
    spa: 'hotelfacility=54',
    restaurant: 'hotelfacility=3',
    fitness_centre: 'hotelfacility=11',
    non_smoking: 'hotelfacility=16',
    front_desk_24h: 'hotelfacility=8',
    pet_friendly: 'hotelfacility=4',
    airport_shuttle: 'hotelfacility=17'
  },
  distance: {
    half_mile: 'distance=805',
    one_mile: 'distance=1610',
    two_miles: 'distance=3220'
  }
};

export const bookingFilterResults: ToolDefinition = {
  name: 'booking_filter_results',
  description:
    'Apply a filter to Booking.com search results. Filter types: property_type (hotels, apartments, holiday_homes, hostels, bed_and_breakfast, guest_houses, villas), star_rating (1_star to 5_stars), review_score (superb, very_good, good, pleasant), facility (free_wifi, parking, swimming_pool, spa, restaurant, fitness_centre, non_smoking, front_desk_24h, pet_friendly, airport_shuttle), distance (half_mile, one_mile, two_miles).',
  inputSchema: {
    type: 'object',
    properties: {
      filterType: {
        type: 'string',
        enum: [
          'property_type',
          'star_rating',
          'review_score',
          'facility',
          'distance'
        ],
        description: 'The type of filter to apply'
      },
      value: {
        type: 'string',
        description: 'The filter value (e.g., "hotels", "4_stars", "free_wifi")'
      }
    },
    required: ['filterType', 'value']
  },
  async execute(input) {
    const {filterType, value} = input as {
      filterType: FilterType;
      value: string;
    };

    const filterMapping = FILTER_MAPPINGS[filterType];
    if (!filterMapping) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid filter type "${filterType}". Valid types: ${Object.keys(FILTER_MAPPINGS).join(', ')}`
          }
        ],
        isError: true
      };
    }

    const filterValue = filterMapping[value];
    if (!filterValue) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid filter value "${value}" for ${filterType}. Valid values: ${Object.keys(filterMapping).join(', ')}`
          }
        ],
        isError: true
      };
    }

    // Find the checkbox with this value
    const checkbox = document.querySelector<HTMLInputElement>(
      `input[type="checkbox"][value="${filterValue}"]`
    );

    if (!checkbox) {
      return {
        content: [
          {
            type: 'text',
            text: `Filter option "${value}" not available on this page. The filter may not apply to this search.`
          }
        ],
        isError: true
      };
    }

    // Find the label to get the display text
    const label = document.querySelector<HTMLLabelElement>(
      `label[for="${checkbox.id}"]`
    );
    const labelText = label?.textContent?.trim().split(/\d/)[0].trim() || value;

    // Click the checkbox
    checkbox.click();

    return {
      content: [
        {
          type: 'text',
          text: `Applied filter: ${labelText}. Use booking_get_results to retrieve the filtered results after the page updates.`
        }
      ]
    };
  }
};
