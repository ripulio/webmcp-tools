# WebMCP Tools

This repository is the source collection for tools made available by the [WebMCP catalog](https://github.com/ripulio/webmcp-catalog).

## Available Tools

TBD

## Contributing Tools

In order to publish tools to the WebMCP catalog, they must be added to this repository. They will then automatically be published to the catalog when the next sync occurs.

If you'd like to contribute a tool, please follow these steps:

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

We will then review this and, if everything is in order, merge it so that your tool becomes part of the WebMCP catalog.

## License

MIT
