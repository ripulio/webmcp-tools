import type {ToolDefinition} from 'webmcp-polyfill';

interface Step {
  [key: string]: unknown;
  stepNumber: number;
  text: string;
}

interface InstructionsOutput {
  [key: string]: unknown;
  recipeTitle: string;
  totalSteps: number;
  steps: Step[];
}

export const tool: ToolDefinition = {
  name: 'allrecipes_get_instructions',
  description:
    'Get the cooking instructions/steps from the current recipe page.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Check if we're on a recipe page
    if (!window.location.pathname.includes('/recipe/')) {
      return {
        content: [
          {
            type: 'text',
            text: 'Not on a recipe page. Navigate to a recipe first.'
          }
        ],
        isError: true
      };
    }

    const title =
      document.querySelector('h1.article-heading')?.textContent?.trim() ||
      'Unknown Recipe';

    // Get steps - they are in an ordered list within the steps section
    const stepsSection = document.querySelector('#mm-recipes-steps_1-0');
    if (!stepsSection) {
      return {
        content: [
          {
            type: 'text',
            text: 'Could not find instructions section on this page.'
          }
        ],
        isError: true
      };
    }

    // Get all paragraph elements within list items (the actual step text)
    const stepParagraphs = stepsSection.querySelectorAll(
      'ol li p.mntl-sc-block-html'
    );

    if (stepParagraphs.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No cooking instructions found on this page.'
          }
        ],
        isError: true
      };
    }

    const steps: Step[] = [];
    let stepNumber = 0;

    stepParagraphs.forEach((p) => {
      const text = p.textContent?.trim();
      // Filter out image credit lines (they typically contain "Dotdash Meredith")
      if (text && !text.includes('Dotdash Meredith')) {
        stepNumber++;
        steps.push({
          stepNumber,
          text
        });
      }
    });

    const output: InstructionsOutput = {
      recipeTitle: title,
      totalSteps: steps.length,
      steps
    };

    const stepsText = steps
      .map((step) => `Step ${step.stepNumber}: ${step.text}`)
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Cooking Instructions for "${title}" (${steps.length} steps):\n\n${stepsText}`
        }
      ],
      structuredContent: output
    };
  }
};
