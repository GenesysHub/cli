# @genesyshub/cli

A CLI tool to initialize and manage GenesysHub mock projects.

## Installation

You can run the CLI directly using:

```bash
bunx @genesyshub/cli init
```

## Commands

### Initialize a new project

```bash
bunx @genesyshub/cli init <project-name>
```

Creates a new project structure based on the [project template](https://github.com/GenesysHub/project_template.git).

### Add an app to an existing project

```bash
bunx @genesyshub/cli add <app-id>
```

This command:
1. Clones the [apps repository](https://github.com/GenesysHub/apps.git) temporarily
2. Copies the specified app into your project's `apps` directory
3. Updates the `ClientSync.tsx` file to include the new app
4. Cleans up temporary files

The CLI will:
- Automatically detect if you're in a TEST project directory
- If not in a project, prompt you to select one from your Documents/TEST directory
- Validate that the app exists in the template repository
- Prevent duplicate app installations

## Template Repositories

This CLI uses the following template repositories:

1. **Project Template**:  
   [https://github.com/GenesysHub/project_template.git](https://github.com/GenesysHub/project_template.git)  
   Used for creating new project structures.

2. **Apps Repository**:  
   [https://github.com/GenesysHub/apps.git](https://github.com/GenesysHub/apps.git)  
   Contains individual apps that can be added to projects.

## Important Notice

During development, some dependencies required by initialized projects are currently private:

- `@genesyshub/core`
- `@genesyshub/tools`

These packages will be made publicly available when development is complete. Until then, you won't be able to fully install dependencies for projects created with this CLI.

## Development Status

This package is currently in active development. The full functionality will be available once all dependencies are publicly released.