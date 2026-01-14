# WebMCP Tools

Source collection for tools published to the [WebMCP catalog](https://github.com/ripulio/webmcp-catalog).

Tools belong to **groups** that provide related functionality. Each tool has a metadata file specifying the domains and URL path patterns where it activates.

## Available Groups

TBD

## Contributing

Tools are automatically published to the catalog on merge. To contribute:

1. Fork this repository

1. Fork this repository.
2. Add your tool to the `src/tools` directory following this structure:
   - Create a directory for your tool group (e.g., `src/tools/my-group/`)
   - Create a group metadata file named `{group-name}.meta.json` with:
     - `id`: The group identifier
     - `name`: Display name for the group
     - `description`: Description of the tool group
     - `tools`: Array of tool IDs in this group
   - For each tool, create:
     - A tool implementation file (e.g., `my-tool.ts`)
     - A tool metadata file (e.g., `my-tool.meta.json`) with:
       - `id`: The tool identifier
       - `description`: Description of the tool
       - `filters`: Optional filters defining where the tool is available (e.g., domain filters)
3. Create a pull request to merge your changes into the main repository

See the `src/tools/example-group/` directory for a complete example.

   ```typescript
   import {ToolDefinition} from 'webmcp-polyfill';

   export const tool: ToolDefinition = {
     name: 'your_tool_name',
     description: 'What your tool does (for LLM consumption).',
     inputSchema: {
       type: 'object',
       properties: {
         // Define input parameters
       }
     },
     async execute(rawInput: unknown) {
       return {
         content: [{type: 'text', text: 'Result'}]
       };
     }
   };
   ```

3. Create a metadata file in `src/tools/metadata/` with the same name:

   ```json
   {
     "name": "your_tool_name",
     "userDescription": "Human-friendly description for UI",
     "domains": ["example.com"],
     "pathPattern": "^/your-path/"
   }
   ```

4. Add your tool to a group in `src/groups/` (or create a new group):

   ```json
   {
     "name": "your-group",
     "description": "Group description",
     "tools": ["your_tool_name"]
   }
   ```

5. Run `npm run lint && npm run build && npm run build:manifest`

6. Open a pull request

## License

MIT
