import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'debug_get_page_summary',
  description:
    'Get a compact overview of the page including title, URL, element counts (forms, buttons, links, inputs), landmarks, and suggested main content selector.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const mainEl = document.querySelector('main');
    const roleMainEl = document.querySelector('[role="main"]');

    const summary = {
      title: document.title,
      url: location.href,
      structure: {
        forms: document.querySelectorAll('form').length,
        buttons: document.querySelectorAll(
          'button, [role="button"], input[type="button"], input[type="submit"]'
        ).length,
        links: document.querySelectorAll('a[href]').length,
        inputs: document.querySelectorAll(
          'input:not([type="hidden"]), textarea, select'
        ).length
      },
      landmarks: [
        ...document.querySelectorAll(
          'header, nav, main, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]'
        )
      ]
        .map((el) => {
          const tag = el.tagName.toLowerCase();
          const role = el.getAttribute('role');
          const id = el.id ? '#' + el.id : '';
          return (role ? role : tag) + id;
        })
        .slice(0, 10),
      mainContentSelector: mainEl?.id
        ? '#' + mainEl.id
        : roleMainEl?.id
          ? '#' + roleMainEl.id
          : 'main'
    };

    const text = [
      `Title: ${summary.title}`,
      `URL: ${summary.url}`,
      `Forms: ${summary.structure.forms}, Buttons: ${summary.structure.buttons}, Links: ${summary.structure.links}, Inputs: ${summary.structure.inputs}`,
      `Landmarks: ${summary.landmarks.join(', ') || '(none)'}`,
      `Main content: ${summary.mainContentSelector}`
    ].join('\n');

    return {
      content: [{type: 'text', text}],
      structuredContent: summary
    };
  }
};
