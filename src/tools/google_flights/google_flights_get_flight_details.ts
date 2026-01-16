import type {ToolDefinition} from 'webmcp-polyfill';

interface FlightLeg {
  [key: string]: unknown;
  departure: string;
  arrival: string;
  duration: string;
  airline: string;
  flightNumber: string;
  aircraft?: string;
  layover?: string;
}

interface FlightDetails {
  [key: string]: unknown;
  outbound: FlightLeg[];
  return?: FlightLeg[];
  totalDuration: string;
  price: string;
  bookingOptions: {provider: string; price: string}[];
}

export const tool: ToolDefinition = {
  name: 'google_flights_get_flight_details',
  description:
    'Get detailed information about a selected flight on Google Flights. Shows leg-by-leg breakdown including departure/arrival times, airlines, flight numbers, layovers, and booking options with prices.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Look for the expanded flight details panel
    const detailsPanel = document.querySelector<HTMLElement>(
      '[role="dialog"], .gws-flights-results__expanded, .YgAgue, [jsname="detailsPanel"]'
    );

    if (
      !detailsPanel &&
      !document.querySelector('.gws-flights-results__itinerary-details')
    ) {
      return {
        content: [
          {
            type: 'text',
            text: 'No flight details panel found. Click on a flight result first using google_flights_click_result.'
          }
        ],
        isError: true
      };
    }

    const container = detailsPanel || document.body;

    // Extract flight legs
    const legElements = container.querySelectorAll<HTMLElement>(
      '.gws-flights-results__leg, [data-leg], .BbR8Ec, .Gv1mTb-aTv5jf'
    );

    const legs: FlightLeg[] = [];

    legElements.forEach((leg) => {
      const times = leg.querySelectorAll(
        'time, [datetime], .gws-flights-results__times span'
      );
      const departure = times[0]?.textContent?.trim() || '';
      const arrival = times[1]?.textContent?.trim() || '';

      const durationEl = leg.querySelector(
        '[aria-label*="uration"], .gws-flights-results__duration'
      );
      const duration = durationEl?.textContent?.trim() || '';

      const airlineEl = leg.querySelector(
        'img[alt], .gws-flights-results__carriers'
      );
      const airline =
        airlineEl?.getAttribute('alt') || airlineEl?.textContent?.trim() || '';

      const flightNumEl = leg.querySelector(
        '[aria-label*="light"], .gws-flights-results__flight-number'
      );
      const flightNumber = flightNumEl?.textContent?.trim() || '';

      const aircraftEl = leg.querySelector(
        '[aria-label*="ircraft"], .gws-flights-results__aircraft'
      );
      const aircraft = aircraftEl?.textContent?.trim() || undefined;

      const layoverEl = leg.querySelector(
        '[aria-label*="ayover"], .gws-flights-results__layover'
      );
      const layover = layoverEl?.textContent?.trim() || undefined;

      if (departure || arrival || airline) {
        legs.push({
          departure,
          arrival,
          duration,
          airline,
          flightNumber,
          aircraft,
          layover
        });
      }
    });

    // Extract total price
    const priceEl = container.querySelector<HTMLElement>(
      '[aria-label*="$"], [aria-label*="£"], [aria-label*="€"], .gws-flights-results__price, .YMlIz, .FpEdX span'
    );
    const price = priceEl?.textContent?.trim() || '';

    // Extract total duration
    const totalDurationEl = container.querySelector<HTMLElement>(
      '.gws-flights-results__total-duration, [aria-label*="otal"]'
    );
    const totalDuration = totalDurationEl?.textContent?.trim() || '';

    // Extract booking options
    const bookingElements = container.querySelectorAll<HTMLElement>(
      '.gws-flights-results__booking-option, .Ky8DTe, [jsname="BookingOption"]'
    );

    const bookingOptions: {provider: string; price: string}[] = [];

    bookingElements.forEach((option) => {
      const providerEl = option.querySelector(
        'img[alt], .gws-flights-results__booking-provider'
      );
      const provider =
        providerEl?.getAttribute('alt') ||
        providerEl?.textContent?.trim() ||
        '';

      const optionPriceEl = option.querySelector(
        '[aria-label*="$"], .gws-flights-results__booking-price'
      );
      const optionPrice = optionPriceEl?.textContent?.trim() || '';

      if (provider || optionPrice) {
        bookingOptions.push({provider, price: optionPrice});
      }
    });

    // Format output
    let output = 'Flight Details:\n\n';

    if (legs.length > 0) {
      output += 'Flight Legs:\n';
      legs.forEach((leg, i) => {
        output += `  ${i + 1}. ${leg.airline} ${leg.flightNumber}\n`;
        output += `     ${leg.departure} → ${leg.arrival} (${leg.duration})\n`;
        if (leg.aircraft) output += `     Aircraft: ${leg.aircraft}\n`;
        if (leg.layover) output += `     Layover: ${leg.layover}\n`;
      });
    }

    if (totalDuration) output += `\nTotal Duration: ${totalDuration}\n`;
    if (price) output += `Price: ${price}\n`;

    if (bookingOptions.length > 0) {
      output += '\nBooking Options:\n';
      bookingOptions.forEach((opt) => {
        output += `  - ${opt.provider}: ${opt.price}\n`;
      });
    }

    const details: FlightDetails = {
      outbound: legs,
      totalDuration,
      price,
      bookingOptions
    };

    return {
      content: [
        {
          type: 'text',
          text:
            output ||
            'Could not extract flight details. The panel may still be loading.'
        }
      ],
      structuredContent: details
    };
  }
};
