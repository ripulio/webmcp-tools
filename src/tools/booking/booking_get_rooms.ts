import type {ToolDefinition} from 'webmcp-polyfill';

interface RoomOption {
  index: number;
  blockId: string;
  roomName: string;
  price: string | null;
  occupancy: string | null;
  bedType: string | null;
}

export const bookingGetRooms: ToolDefinition = {
  name: 'booking_get_rooms',
  description:
    'Get available room options and prices for a property on Booking.com. Requires dates to be set (either via URL parameters or booking_set_dates). Returns room names, prices, bed types, and occupancy info.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of room types to return (default: 10)'
      }
    },
    required: []
  },
  async execute(input) {
    const {limit = 10} = input as {limit?: number};

    // Try primary selector first
    let table = document.querySelector('#hprt-table');

    // Fallback selectors for alternative layouts
    if (!table) {
      table = document.querySelector('[data-testid="availability-table"]');
    }
    if (!table) {
      table = document.querySelector('.hprt-table');
    }

    if (!table) {
      return {
        content: [
          {
            type: 'text',
            text: 'Room availability table not found. Make sure you are on a Booking.com property page. The page may still be loading or this property type may not show room options.'
          }
        ],
        isError: true
      };
    }

    // Try multiple selectors for table rows
    let tableRows = table.querySelectorAll<HTMLElement>(
      'tbody tr[data-block-id]'
    );

    // Fallback: try without tbody
    if (tableRows.length === 0) {
      tableRows = table.querySelectorAll<HTMLElement>('tr[data-block-id]');
    }

    if (tableRows.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No room availability found. The property may be fully booked, or this property type may not display room options in the standard format.'
          }
        ],
        isError: true
      };
    }

    // Extract unique rooms
    const roomsMap = new Map<string, RoomOption>();
    let index = 0;

    for (const row of tableRows) {
      const blockId = row.getAttribute('data-block-id');
      if (!blockId || blockId === 'header_survey') continue;

      // Try multiple selectors for room name
      let roomNameEl = row.querySelector('.hprt-roomtype-icon-link');
      if (!roomNameEl) {
        roomNameEl = row.querySelector('[data-testid="room-name"]');
      }
      if (!roomNameEl) {
        roomNameEl = row.querySelector('.room-name, .rt-room-name');
      }

      const roomName = roomNameEl?.textContent?.trim();
      if (!roomName || roomsMap.has(roomName)) continue;

      // Try multiple selectors for price
      let priceEl = row.querySelector('.bui-price-display__value');
      if (!priceEl) {
        priceEl = row.querySelector(
          '[data-testid="price-and-discounted-price"]'
        );
      }

      const occupancyEl = row.querySelector('.hprt-occupancy-occupancy-info');
      const bedTypeEl = row.querySelector('.hprt-roomtype-bed');

      roomsMap.set(roomName, {
        index,
        blockId,
        roomName,
        price: priceEl?.textContent?.trim() || null,
        occupancy: occupancyEl?.textContent?.trim() || null,
        bedType: bedTypeEl?.textContent?.trim() || null
      });

      index++;
      if (index >= limit) break;
    }

    const rooms = Array.from(roomsMap.values());

    if (rooms.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No room options found. The property may be fully booked or dates may not be selected.'
          }
        ],
        isError: true
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Found ${rooms.length} room types:\n\n${rooms
            .map(
              (r) =>
                `[${r.index}] ${r.roomName}\n    Price: ${r.price || 'N/A'} | ${r.bedType || 'N/A'} | ${r.occupancy || 'N/A'}`
            )
            .join('\n\n')}`
        }
      ],
      structuredContent: {
        rooms,
        totalRoomTypes: rooms.length
      }
    };
  }
};
