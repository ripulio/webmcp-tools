import type {ToolDefinition} from 'webmcp-polyfill';

interface GetFormsParams {
  limit?: number;
  maxFieldsPerForm?: number;
  maxSelectOptions?: number;
}

export const tool: ToolDefinition = {
  name: 'debug_get_forms',
  description:
    'Extract form structures including fields, types, names, and select options. Use to understand form layout before filling.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum forms to return (default: 5)'
      },
      maxFieldsPerForm: {
        type: 'number',
        description: 'Maximum fields per form (default: 20)'
      },
      maxSelectOptions: {
        type: 'number',
        description: 'Maximum options per select (default: 5)'
      }
    },
    required: []
  },
  async execute(params: unknown) {
    const {limit = 5, maxFieldsPerForm = 20, maxSelectOptions = 5} = (params as GetFormsParams) || {};
    const forms: Array<{[key: string]: unknown}> = [];
    let totalForms = 0;

    document.querySelectorAll('form').forEach((form, index) => {
      totalForms++;
      if (forms.length >= limit) return;

      const fields: Array<{[key: string]: unknown}> = [];
      let totalFields = 0;

      form.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(el => {
        totalFields++;
        if (fields.length >= maxFieldsPerForm) return;

        const inputEl = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        let options: Array<{value: string; text: string}> | undefined;

        if (el.tagName === 'SELECT') {
          const selectEl = el as HTMLSelectElement;
          const allOptions = Array.from(selectEl.options);
          options = allOptions.slice(0, maxSelectOptions).map(o => ({value: o.value, text: o.text}));
          if (allOptions.length > maxSelectOptions) {
            options.push({value: '...', text: `[${allOptions.length - maxSelectOptions} more options]`});
          }
        }

        fields.push({
          tag: el.tagName.toLowerCase(),
          type: (inputEl as HTMLInputElement).type || '',
          name: inputEl.name || '',
          id: inputEl.id || '',
          placeholder: (inputEl as HTMLInputElement).placeholder || '',
          required: inputEl.required || false,
          options
        });
      });

      forms.push({
        index,
        id: form.id || '',
        action: form.action || '',
        method: form.method || 'get',
        selector: form.id ? '#' + form.id : `form:nth-of-type(${index + 1})`,
        fields,
        fieldsMeta: {
          total: totalFields,
          returned: fields.length,
          truncated: totalFields > fields.length
        }
      });
    });

    const summary = forms.map(f => {
      const fieldsSummary = (f.fields as Array<{[key: string]: unknown}>).map(field => {
        const req = field.required ? ' *' : '';
        return `    - ${field.tag}[${field.type || field.tag}] name="${field.name}"${req}`;
      }).join('\n');
      return `Form ${f.index} (${f.selector}):\n  action: ${f.action || '(none)'}\n  method: ${f.method}\n  fields (${(f.fieldsMeta as {total: number}).total}):\n${fieldsSummary}`;
    }).join('\n\n');

    return {
      content: [{type: 'text', text: `Found ${totalForms} form(s):\n\n${summary || '(no forms found)'}`}],
      structuredContent: {
        forms,
        meta: {
          totalForms,
          returned: forms.length,
          truncated: totalForms > forms.length,
          limit
        }
      }
    };
  }
};
