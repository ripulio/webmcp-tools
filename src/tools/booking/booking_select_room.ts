import type {ToolDefinition} from 'webmcp-polyfill';

export const bookingSelectRoom: ToolDefinition = {
  name: 'booking_select_room',
  description:
    'Select a room to reserve on a Booking.com property page. Use the index from booking_get_rooms to specify which room type to select. This will highlight the room for reservation.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'The index of the room type to select (from booking_get_rooms)'
      }
    },
    required: ['index']
  },
  async execute(input) {
    const {index} = input as {index: number};

    const table = document.querySelector('#hprt-table');

    if (!table) {
      return {
        content: [
          {
            type: 'text',
            text: 'Room availability table not found. Make sure you are on a Booking.com property page with dates selected.'
          }
        ],
        isError: true
      };
    }

    const tableRows = table.querySelectorAll<HTMLElement>(
      'tbody tr[data-block-id]'
    );

    // Build list of unique rooms to match the index
    const roomsMap = new Map<string, HTMLElement>();
    let currentIndex = 0;

    for (const row of tableRows) {
      const blockId = row.getAttribute('data-block-id');
      if (!blockId || blockId === 'header_survey') continue;

      const roomNameEl = row.querySelector('.hprt-roomtype-icon-link');
      const roomName = roomNameEl?.textContent?.trim();

      if (!roomName || roomsMap.has(roomName)) continue;

      roomsMap.set(roomName, row);
      currentIndex++;
    }

    const rooms = Array.from(roomsMap.entries());

    if (index < 0 || index >= rooms.length) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid room index ${index}. Please provide an index between 0 and ${rooms.length - 1}.`
          }
        ],
        isError: true
      };
    }

    const [roomName, row] = rooms[index];

    // Find the select dropdown or reserve button in this row
    const selectDropdown = row.querySelector<HTMLSelectElement>(
      'select.hprt-nos-select'
    );

    if (selectDropdown) {
      // Set to 1 room
      selectDropdown.value = '1';
      selectDropdown.dispatchEvent(new Event('change', {bubbles: true}));

      return {
        content: [
          {
            type: 'text',
            text: `Selected 1x "${roomName}". Look for the "I'll reserve" or "Reserve" button to proceed with booking.`
          }
        ]
      };
    }

    // Alternative: Look for a radio button or direct select option
    const radioButton = row.querySelector<HTMLInputElement>(
      'input[type="radio"]'
    );

    if (radioButton) {
      radioButton.click();

      return {
        content: [
          {
            type: 'text',
            text: `Selected "${roomName}". Look for the "Reserve" button to proceed with booking.`
          }
        ]
      };
    }

    // Scroll to the room row to make it visible
    row.scrollIntoView({behavior: 'smooth', block: 'center'});

    return {
      content: [
        {
          type: 'text',
          text: `Scrolled to room "${roomName}". Look for selection options or the "Reserve" button in this row to proceed.`
        }
      ]
    };
  }
};
