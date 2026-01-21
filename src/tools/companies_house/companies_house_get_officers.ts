import type {ToolDefinition} from 'webmcp-polyfill';

interface Officer {
  [key: string]: unknown;
  index: number;
  name: string;
  role: string;
  status: string;
  appointedOn: string | null;
  resignedOn: string | null;
  address: string | null;
  nationality: string | null;
  dateOfBirth: string | null;
  occupation: string | null;
  profileUrl: string | null;
}

interface StructuredContent {
  [key: string]: unknown;
  officers: Officer[];
  totalCount: number;
  companyName: string | null;
  companyNumber: string | null;
}

export const companiesHouseGetOfficers: ToolDefinition = {
  name: 'companies_house_get_officers',
  description:
    'Get the list of officers (directors, secretaries) from a company officers page. Returns officer names, roles, appointment dates, and other details.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of officers to return (default: 20)'
      },
      activeOnly: {
        type: 'boolean',
        description: 'Only return active officers (default: false)'
      }
    },
    required: []
  },
  async execute(input) {
    const {limit = 20, activeOnly = false} = input as {
      limit?: number;
      activeOnly?: boolean;
    };

    // Check if we're on an officers page
    const appointmentsList = document.querySelector('.appointments-list');
    if (!appointmentsList) {
      return {
        content: [
          {
            type: 'text',
            text: 'Officers list not found. Make sure you are on a company officers page. Use companies_house_go_to_officers first.'
          }
        ],
        isError: true
      };
    }

    // Get company info from header
    const companyHeader = document.querySelector('.company-header h1');
    const companyName = companyHeader?.textContent?.trim() || null;
    const companyNumberEl = document.querySelector('#company-number strong');
    const companyNumber = companyNumberEl?.textContent?.trim() || null;

    // Get all officer appointments
    const appointments = document.querySelectorAll(
      '[class^="appointment-"], [class*=" appointment-"]'
    );

    const officers: Officer[] = [];

    appointments.forEach((appt) => {
      if (officers.length >= limit) return;

      // Get officer name and link
      const nameLink = appt.querySelector<HTMLAnchorElement>(
        'h2 a.govuk-link, h2 span a.govuk-link'
      );
      const nameSpan = appt.querySelector('h2 span[id^="officer-name-"]');
      const name =
        nameLink?.textContent?.trim() ||
        nameSpan?.textContent?.trim() ||
        'Unknown';
      const profileUrl = nameLink?.href || null;

      // Get status
      const statusTag = appt.querySelector('[id^="officer-status-tag-"]');
      const status = statusTag?.textContent?.trim() || 'Unknown';

      // Skip inactive officers if activeOnly is true
      if (activeOnly && status.toLowerCase() !== 'active') {
        return;
      }

      // Get role
      const roleEl = appt.querySelector('[id^="officer-role-"]');
      const role = roleEl?.textContent?.trim() || 'Unknown';

      // Get address
      const addressEl = appt.querySelector('[id^="officer-address-value-"]');
      const address = addressEl?.textContent?.trim() || null;

      // Get other details from dl elements
      let appointedOn: string | null = null;
      let resignedOn: string | null = null;
      let nationality: string | null = null;
      let dateOfBirth: string | null = null;
      let occupation: string | null = null;

      const dts = appt.querySelectorAll('dt');
      dts.forEach((dt) => {
        const label = dt.textContent?.trim().toLowerCase() || '';
        const dd = dt.nextElementSibling;
        const value = dd?.textContent?.trim() || null;

        if (label.includes('appointed')) {
          appointedOn = value;
        } else if (label.includes('resigned')) {
          resignedOn = value;
        } else if (label.includes('nationality')) {
          nationality = value;
        } else if (label.includes('date of birth')) {
          dateOfBirth = value;
        } else if (label.includes('occupation')) {
          occupation = value;
        }
      });

      officers.push({
        index: officers.length,
        name,
        role,
        status,
        appointedOn,
        resignedOn,
        address,
        nationality,
        dateOfBirth,
        occupation,
        profileUrl
      });
    });

    // Build text output
    let textOutput = `Company Officers`;
    if (companyName) textOutput += ` for ${companyName}`;
    if (companyNumber) textOutput += ` (${companyNumber})`;
    textOutput += `\n${'='.repeat(40)}\n\n`;
    textOutput += `Found ${officers.length} officers${activeOnly ? ' (active only)' : ''}:\n\n`;

    textOutput += officers
      .map((o) => {
        let line = `[${o.index}] ${o.name}`;
        line += `\n    Role: ${o.role} (${o.status})`;
        if (o.appointedOn) line += `\n    Appointed: ${o.appointedOn}`;
        if (o.resignedOn) line += `\n    Resigned: ${o.resignedOn}`;
        if (o.nationality) line += `\n    Nationality: ${o.nationality}`;
        if (o.dateOfBirth) line += `\n    Date of Birth: ${o.dateOfBirth}`;
        if (o.occupation) line += `\n    Occupation: ${o.occupation}`;
        if (o.address) line += `\n    Address: ${o.address}`;
        return line;
      })
      .join('\n\n');

    const structuredContent: StructuredContent = {
      officers,
      totalCount: officers.length,
      companyName,
      companyNumber
    };

    return {
      content: [
        {
          type: 'text',
          text: textOutput
        }
      ],
      structuredContent
    };
  }
};
