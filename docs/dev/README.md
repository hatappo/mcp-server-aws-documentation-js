# Development Process

The [docs/dev](./docs/dev) folder contains the following types of files. Use these to proceed with development.

Files

- `${id}-REQ-${dev-title}.md`: Contains the requirements or requests for the development. This file is mainly used for reading purposes only.
- `${id}-TASK-${dev-title}.md`: Write out a list of tasks corresponding to the development content here, and check them off as each task is completed.
- `${id}-DOC-${dev-title}.md`: Documentation corresponding to the development content. Please include design policies, implementation details, important notes, etc.

Parameters

- `id`: A unique sequential number starting from 01.
- `dev-title`: A concise phrase representing the development content. Written in snake_case.

Others

- Also update [README.md](./README.md) each time development is completed for each id unit.

## for development with Javascript/Typescript

- Use async/await as much as possible instead of `Promise`.
- Use native `fetch` instead of `axios` package.
- Use the `node` command directly for Node execution. The latest Node can execute Typescript without any special options.
- Manage Node and NPM with Volta, and pin those versions in package.json.
- Use the `npm install` command instead of writing dependencies directly in package.json. This is to select the latest version of packages.
- Use the latest `Vitest` for unit testing.
- Use the latest `Biome` for linter and formatter.
- Use ESModules as much as possible instead of CommonJS for the module system.
