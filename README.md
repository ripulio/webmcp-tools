# WebMCP Tools

Source collection for tools published to the [WebMCP catalog](https://github.com/ripulio/webmcp-catalog).

Tools belong to **servers** that run on specific domains. Each tool defines a `pathPattern`—a regex matching URL paths where the tool activates.

## Available Tools

TBD

## Contributing

Tools are automatically published to the catalog on merge. To contribute:

1. Fork this repository
2. Create a new file in `src/tools/` exporting a `ToolBinding`:

   ```typescript
   import {ToolBinding} from '../shared.js';

   export const tool: ToolBinding = {
     name: 'your_tool_name',
     description: 'What your tool does.',
     inputSchema: {
       type: 'object',
       properties: {
         // Define input parameters
       }
     },
     pathPattern: '^/your-path/',
     async execute(rawInput: unknown) {
       return {
         content: [{type: 'text', text: 'Result'}]
       };
     }
   };
   ```

3. Run `npm run lint && npm run build`
4. Open a pull request

## License

MIT
