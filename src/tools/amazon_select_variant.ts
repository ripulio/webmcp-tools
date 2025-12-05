export const tool = {
  name: 'amazon_select_variant',
  description: 'Select a product variant (color, size, style) on an Amazon product page. Use get_product_details first to see available variants.',
  inputSchema: {
    type: 'object',
    properties: {
      variantType: {
        type: 'string',
        description: 'Type of variant to select: "color", "size", or "style"',
        enum: ['color', 'size', 'style']
      },
      value: {
        type: 'string',
        description: 'The variant value to select (e.g., "Black", "Large", "2-Pack")'
      }
    },
    required: ['variantType', 'value']
  },
  async execute(rawInput: { variantType?: string; value?: string }) {
    const { variantType, value } = rawInput || {};

    if (!variantType || !value) {
      return {
        content: [{ type: 'text' as const, text: 'Both variantType and value parameters are required.' }],
        isError: true
      };
    }

    // Map variant types to their container selectors
    const variantSelectors: Record<string, string[]> = {
      color: ['#variation_color_name li', '[id*="color_name"] li', '#color_name li'],
      size: ['#variation_size_name li', '[id*="size_name"] li', '#size_name li'],
      style: ['#variation_style_name li', '[id*="style_name"] li', '#style_name li']
    };

    const selectors = variantSelectors[variantType];
    if (!selectors) {
      return {
        content: [{ type: 'text' as const, text: `Invalid variant type: ${variantType}. Use "color", "size", or "style".` }],
        isError: true
      };
    }

    let variantElements: NodeListOf<Element> | null = null;
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        variantElements = elements;
        break;
      }
    }

    if (!variantElements || variantElements.length === 0) {
      return {
        content: [{ type: 'text' as const, text: `No ${variantType} variants found on this product page. This product may not have ${variantType} options.` }],
        isError: true
      };
    }

    // Find matching variant - use exact matching or word boundary matching
    const valueLower = value.toLowerCase().trim();
    let matchedVariant: Element | null = null;
    const availableOptions: string[] = [];

    // Helper to check if value matches with word boundaries
    const matchesValue = (text: string): boolean => {
      const textLower = text.toLowerCase().trim();
      // Exact match
      if (textLower === valueLower) return true;
      // Word boundary match (e.g., "Black" matches "Click to select Black" but not "Black/White")
      const wordBoundaryRegex = new RegExp(`\\b${valueLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return wordBoundaryRegex.test(text);
    };

    for (const variant of variantElements) {
      const title = variant.getAttribute('title') || '';
      const text = variant.textContent?.trim() || '';
      const imgAlt = variant.querySelector('img')?.alt || '';

      // Collect available options for error message
      const optionName = title || text || imgAlt;
      if (optionName && !availableOptions.includes(optionName)) {
        availableOptions.push(optionName);
      }

      // Check if this variant matches using word boundary matching
      if (matchesValue(title) || matchesValue(text) || matchesValue(imgAlt)) {
        matchedVariant = variant;
        break;
      }
    }

    if (!matchedVariant) {
      return {
        content: [{ type: 'text' as const, text: `${variantType} "${value}" not found. Available options: ${availableOptions.slice(0, 10).join(', ')}` }],
        isError: true
      };
    }

    // Click the variant
    const clickTarget = matchedVariant.querySelector('button, a, img') || matchedVariant;
    (clickTarget as HTMLElement).click();

    return {
      content: [{ type: 'text' as const, text: `Selected ${variantType}: ${value}` }],
      structuredContent: { variantType, value, action: 'variant_selected' }
    };
  }
};
