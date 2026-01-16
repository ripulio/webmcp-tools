import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_flights_get_search_state',
  description:
    'Get the current state of the flight search form on Google Flights, including origin, destination, dates, passenger count, trip type, and cabin class.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Get origin
    const originInput = document.querySelector<HTMLInputElement>(
      'input[aria-label*="Where from"]'
    );
    const origin = originInput?.value || 'Not set';

    // Get destination
    const destInput = document.querySelector<HTMLInputElement>(
      'input[aria-label*="Where to"]'
    );
    const destination = destInput?.value || 'Not set';

    // Get departure date
    const depInput = document.querySelector<HTMLInputElement>(
      'input[aria-label="Departure"]'
    );
    const departureDate = depInput?.value || 'Not set';

    // Get return date
    const retInput = document.querySelector<HTMLInputElement>(
      'input[aria-label="Return"]'
    );
    const returnDate = retInput?.value || 'Not set';

    // Get passenger count from button label
    const passengerBtn = document.querySelector<HTMLButtonElement>(
      'button[aria-label*="passenger"]'
    );
    const passengersLabel = passengerBtn?.getAttribute('aria-label') || '';
    const passengersMatch = passengersLabel.match(/(\d+)\s*passenger/i);
    const passengers = passengersMatch ? passengersMatch[1] : 'Unknown';

    // Get trip type from dropdown
    const tripTypeDropdown = document.querySelector<HTMLElement>(
      '[role="combobox"][aria-expanded]'
    );
    const tripTypeText =
      tripTypeDropdown
        ?.closest('.RLVa8')
        ?.querySelector('span[jsname="V67aGc"]')?.textContent ||
      tripTypeDropdown?.textContent?.trim() ||
      'Round trip';

    // Get cabin class - look for the second dropdown
    const dropdowns = document.querySelectorAll('[role="combobox"]');
    let cabinClass = 'Economy';
    if (dropdowns.length > 1) {
      const classDropdown = dropdowns[1];
      cabinClass =
        classDropdown?.closest('.RLVa8')?.querySelector('span[jsname="V67aGc"]')
          ?.textContent ||
        classDropdown?.textContent?.trim() ||
        'Economy';
    }

    const state = {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      tripType: tripTypeText,
      cabinClass
    };

    return {
      content: [
        {
          type: 'text',
          text: `Flight Search State:
- Origin: ${state.origin}
- Destination: ${state.destination}
- Departure: ${state.departureDate}
- Return: ${state.returnDate}
- Passengers: ${state.passengers}
- Trip Type: ${state.tripType}
- Cabin Class: ${state.cabinClass}`
        }
      ],
      structuredContent: state
    };
  }
};
