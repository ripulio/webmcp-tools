import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'pastebin_set_syntax_highlighting',
  description:
    'Set the syntax highlighting format for a new paste. Common values: None, Bash, C, C#, C++, CSS, HTML, JSON, Java, JavaScript, Lua, PHP, Perl, Python, Ruby, Swift, SQL, XML, YAML.',
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        description:
          'The syntax highlighting format (e.g., "Python", "JavaScript", "None")'
      }
    },
    required: ['format']
  },
  async execute(input) {
    const {format} = input as {format: string};

    const select = document.querySelector(
      '#postform-format'
    ) as HTMLSelectElement;
    if (!select) {
      return {
        content: [
          {
            type: 'text',
            text: 'Syntax format select not found. Make sure you are on the Pastebin homepage (pastebin.com).'
          }
        ],
        isError: true
      };
    }

    // Find the option that matches the format (case-insensitive)
    const options = Array.from(select.options);
    const matchingOption = options.find(
      (opt) => opt.text.toLowerCase() === format.toLowerCase()
    );

    if (!matchingOption) {
      const availableFormats = options
        .slice(0, 20)
        .map((opt) => opt.text)
        .join(', ');
      return {
        content: [
          {
            type: 'text',
            text: `Format "${format}" not found. Some available formats: ${availableFormats}...`
          }
        ],
        isError: true
      };
    }

    select.value = matchingOption.value;
    select.dispatchEvent(new Event('change', {bubbles: true}));

    // Also trigger select2 if present
    const select2Container = document.querySelector(
      '[aria-labelledby="select2-postform-format-container"]'
    );
    if (select2Container) {
      const event = new CustomEvent('select2:select', {bubbles: true});
      select.dispatchEvent(event);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Set syntax highlighting to "${matchingOption.text}".`
        }
      ]
    };
  }
};
