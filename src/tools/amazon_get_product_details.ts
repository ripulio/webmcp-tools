export const tool = {
  name: 'amazon_get_product_details',
  description: 'Get detailed information about the current Amazon product page including title, price, rating, availability, and description.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const titleEl = document.querySelector('#productTitle');
    if (!titleEl) {
      return {
        content: [{ type: 'text' as const, text: 'Product title not found. Make sure you are on an Amazon product page.' }],
        isError: true
      };
    }

    const title = titleEl.textContent?.trim() || '';

    // Extract ASIN from URL - handle various URL formats
    const asinPatterns = [
      /\/dp\/([A-Z0-9]{10})/i,
      /\/gp\/product\/([A-Z0-9]{10})/i,
      /\/product\/([A-Z0-9]{10})/i,
      /[?&]asin=([A-Z0-9]{10})/i
    ];
    let asin: string | null = null;
    const fullUrl = window.location.href;
    for (const pattern of asinPatterns) {
      const match = fullUrl.match(pattern);
      if (match) {
        asin = match[1].toUpperCase();
        break;
      }
    }
    if (!asin) {
      asin = document.querySelector('[data-asin]')?.getAttribute('data-asin') || null;
    }

    // Get price - comprehensive selector list covering various Amazon layouts
    const priceSelectors = [
      '#corePrice_feature_div .a-price .a-offscreen',
      '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
      '.a-price .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#priceblock_saleprice',
      '#price_inside_buybox',
      '.apexPriceToPay .a-offscreen',
      '#newBuyBoxPrice',
      '.a-color-price'
    ];
    let price: string | null = null;
    for (const selector of priceSelectors) {
      const el = document.querySelector(selector);
      const text = el?.textContent?.trim();
      if (text && text.match(/[\$£€\d]/)) {
        price = text;
        break;
      }
    }

    // Get rating
    const ratingEl = document.querySelector('#acrPopover, .a-icon-star-small');
    const rating = ratingEl?.getAttribute('title') ||
                   ratingEl?.querySelector('.a-icon-alt')?.textContent?.trim() || null;

    // Get review count
    const reviewCountEl = document.querySelector('#acrCustomerReviewText');
    const reviewCount = reviewCountEl?.textContent?.trim()?.replace(/[()]/g, '') || null;

    // Get availability
    const availabilityEl = document.querySelector('#availability span, #availability');
    const availability = availabilityEl?.textContent?.trim() || null;

    // Get product features/bullets
    const featureEls = document.querySelectorAll('#feature-bullets li span.a-list-item');
    const features: string[] = [];
    featureEls.forEach((el, i) => {
      if (i < 5) {
        const text = el.textContent?.trim();
        if (text && !text.startsWith('›')) {
          features.push(text);
        }
      }
    });

    // Check for variants
    const colorVariants = document.querySelectorAll('#variation_color_name li, [id*="color_name"] li');
    const sizeVariants = document.querySelectorAll('#variation_size_name li, [id*="size_name"] li');
    const hasVariants = colorVariants.length > 0 || sizeVariants.length > 0;

    const details = {
      title,
      asin,
      price,
      rating,
      reviewCount,
      availability,
      features,
      hasVariants,
      variantCounts: {
        colors: colorVariants.length,
        sizes: sizeVariants.length
      }
    };

    const summary = [
      `Title: ${title}`,
      `ASIN: ${asin || 'N/A'}`,
      `Price: ${price || 'N/A'}`,
      `Rating: ${rating || 'N/A'} (${reviewCount || 'N/A'} reviews)`,
      `Availability: ${availability || 'N/A'}`,
      features.length > 0 ? `\nKey Features:\n${features.map(f => `• ${f.substring(0, 80)}${f.length > 80 ? '...' : ''}`).join('\n')}` : ''
    ].filter(Boolean).join('\n');

    return {
      content: [{ type: 'text' as const, text: summary }],
      structuredContent: details
    };
  }
};
