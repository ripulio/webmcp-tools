import type {ToolDefinition} from 'webmcp-polyfill';

interface FlightResult {
  index: number;
  departure: string;
  arrival: string;
  duration: string;
  airline: string;
  stops: string;
  price: string;
  emissions?: string;
}

export const tool: ToolDefinition = {
  name: 'google_flights_get_results',
  description:
    'Get the list of flight search results from a Google Flights results page. Returns flight details including times, duration, airline, stops, and price. Use google_flights_click_result to select a specific flight.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)'
      }
    },
    required: []
  },
  async execute(input) {
    const {limit = 10} = input as {limit?: number};

    // Google Flights uses list items with role="listitem" or specific classes for results
    // Look for flight result rows - they typically contain departure, arrival, duration, price info
    const flightRows = document.querySelectorAll<HTMLElement>(
      'ul[role="list"] > li, .pIav2d, [jsname="IWWDBc"], .yR1fYc, .Rk10dc > li'
    );

    if (flightRows.length === 0) {
      // Try alternative selectors for flight results
      const altResults = document.querySelectorAll<HTMLElement>(
        '[data-ved][role="button"], .gws-flights-results__itinerary'
      );

      if (altResults.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No flight results found. Make sure you are on a Google Flights search results page and the results have loaded.'
            }
          ],
          isError: true
        };
      }
    }

    const results: FlightResult[] = [];
    const rows = Array.from(flightRows).slice(0, limit);

    rows.forEach((row, index) => {
      // Extract flight information from each row
      // Times are typically in spans with specific formatting
      const timeElements = row.querySelectorAll(
        'span[aria-label*="epart"], span[aria-label*="rriv"], .gws-flights__itinerary-times span'
      );
      const times = Array.from(timeElements)
        .map((el) => el.textContent?.trim())
        .filter(Boolean);

      // Duration
      const durationEl = row.querySelector(
        '[aria-label*="uration"], .gws-flights-results__duration'
      );
      const duration = durationEl?.textContent?.trim() || '';

      // Airline
      const airlineEl = row.querySelector(
        '[aria-label*="perated"], .gws-flights-results__carriers, img[alt]'
      );
      const airline =
        airlineEl?.getAttribute('alt') || airlineEl?.textContent?.trim() || '';

      // Stops
      const stopsEl = row.querySelector(
        '[aria-label*="stop"], .gws-flights-results__stops'
      );
      const stops = stopsEl?.textContent?.trim() || '';

      // Price
      const priceEl = row.querySelector(
        '[aria-label*="$"], [aria-label*="£"], [aria-label*="€"], .gws-flights-results__price, .YMlIz'
      );
      const price = priceEl?.textContent?.trim() || '';

      // Emissions
      const emissionsEl = row.querySelector(
        '[aria-label*="emission"], [aria-label*="CO2"]'
      );
      const emissions = emissionsEl?.textContent?.trim() || undefined;

      if (times.length > 0 || price) {
        results.push({
          index,
          departure: times[0] || '',
          arrival: times[1] || '',
          duration,
          airline,
          stops,
          price,
          emissions
        });
      }
    });

    if (results.length === 0) {
      // If structured parsing failed, try to get basic info from aria-labels
      const allButtons = document.querySelectorAll<HTMLElement>(
        '[role="button"][aria-label*="flight"], [role="button"][aria-label*="$"]'
      );
      allButtons.forEach((btn, index) => {
        if (index < limit) {
          const label = btn.getAttribute('aria-label') || '';
          results.push({
            index,
            departure: '',
            arrival: '',
            duration: '',
            airline: '',
            stops: '',
            price: label
          });
        }
      });
    }

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Could not parse flight results. The page structure may have changed or results are still loading.'
          }
        ],
        isError: true
      };
    }

    const formattedResults = results
      .map(
        (r, i) =>
          `${i + 1}. ${r.airline || 'Flight'}: ${r.departure} - ${r.arrival} (${r.duration}) | ${r.stops || 'Nonstop'} | ${r.price}${r.emissions ? ` | ${r.emissions}` : ''}`
      )
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} flights:\n\n${formattedResults}\n\nUse google_flights_click_result with an index to select a flight.`
        }
      ],
      structuredContent: {results}
    };
  }
};
