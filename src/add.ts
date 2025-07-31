import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

const APPS_TEMPLATE_REPO = 'https://github.com/genesyshub/apps.git';
const TEMP_DIR = path.join(process.cwd(), '.temp_apps');
const DOCS_TEST_PATH = path.join(require('os').homedir(), 'Documents', 'TEST');

export async function add(args: string[]): Promise<void> {
  const [appId] = args;

  if (!appId) {
    console.error('Please specify an app to add');
    console.log('Usage: bunx @genesyshub/cli add <appId>');
    process.exit(1);
  }

  // Check if we're in a TEST subdirectory
  let projectRoot = findTestProjectRoot(process.cwd());

  if (!projectRoot) {
    // Not in a TEST project - let user select one
    const selectedProject = await selectProject();
    if (!selectedProject) {
      console.error('No valid project selected');
      process.exit(1);
    }
    projectRoot = selectedProject;
  }
  // Type assertion since we've validated projectRoot exists
  const safeProjectRoot = projectRoot;

  // [Previous code for cloning, copying, and updating ClientSync.tsx]
  // Step 1: Clone apps template repo
  console.log(`Fetching app template for ${appId}...`);
  try {
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true });
    }
    execSync(`git clone ${APPS_TEMPLATE_REPO} ${TEMP_DIR}`, { stdio: 'inherit' });

    // Verify app exists in template
    const appPath = path.join(TEMP_DIR, appId);
    if (!fs.existsSync(appPath)) {
      throw new Error(`App ${appId} not found in template repository`);
    }

    // Step 2: Copy app to project
    const targetAppPath = path.join(safeProjectRoot, 'apps', appId);
    if (fs.existsSync(targetAppPath)) {
      throw new Error(`App ${appId} already exists in project`);
    }

    fs.mkdirSync(path.join(safeProjectRoot, 'apps'), { recursive: true });
    fs.cpSync(appPath, targetAppPath, { recursive: true });

    // Step 3: Update ClientSync.tsx
    updateClientSync(safeProjectRoot, appId);

    console.log(`✅ Successfully added ${appId} to project!`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error adding app: ${error.message}`);
    } else {
      console.error(`❌ Unknown error occurred: ${String(error)}`);
    }
    process.exit(1);
  } finally {
    // Clean up
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true });
    }
  }
}

function findTestProjectRoot(currentDir: string): string | null {
  // Check if we're inside Documents/TEST
  if (currentDir.startsWith(DOCS_TEST_PATH)) {
    // The project root is the immediate child of TEST directory
    const parts = path.relative(DOCS_TEST_PATH, currentDir).split(path.sep);
    if (parts[0] && parts[0] !== '..') {  // Ensure we're in a subdirectory
      const projectRoot = path.join(DOCS_TEST_PATH, parts[0]);
      if (fs.existsSync(path.join(projectRoot, 'apps'))) {
        return projectRoot;
      }
    }
  }
  return null;
}


async function selectProject(): Promise<string | null> {
  if (!fs.existsSync(DOCS_TEST_PATH)) {
    console.error(`TEST directory not found at ${DOCS_TEST_PATH}`);
    return null;
  }

  const projects = fs.readdirSync(DOCS_TEST_PATH).filter((item) => {
    const fullPath = path.join(DOCS_TEST_PATH, item);
    return fs.statSync(fullPath).isDirectory();
  });

  if (projects.length === 0) {
    console.error('No projects found in TEST directory');
    return null;
  }

  console.log('\nAvailable projects:');
  projects.forEach((project, index) => {
    console.log(`${index + 1}. ${project}`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\nEnter the number of the project to add the app to: ', (answer) => {
      rl.close();
      const selectedIndex = parseInt(answer) - 1;

      if (isNaN(selectedIndex)) {
        console.error('Invalid selection: Please enter a number');
        resolve(null);
      } else if (selectedIndex < 0 || selectedIndex >= projects.length) {
        console.error('Invalid selection: Number out of range');
        resolve(null);
      } else {
        resolve(path.join(DOCS_TEST_PATH, projects[selectedIndex]));
      }
    });
  });
}

function updateClientSync(projectRoot: string, appId: string): void {
  const clientSyncPath = path.join(projectRoot, 'app', 'components', 'ClientSync.tsx');

  if (!fs.existsSync(clientSyncPath)) {
    throw new Error('ClientSync.tsx not found in project');
  }

  let content = fs.readFileSync(clientSyncPath, 'utf8');

  // Add import if not already present
  const importStatement = `import ${appId} from 'apps/${appId}';`;
  if (!content.includes(importStatement)) {
    const firstImportIndex = content.indexOf('import');
    if (firstImportIndex === -1) {
      throw new Error('No imports found in ClientSync.tsx');
    }
    content =
      content.slice(0, firstImportIndex) + importStatement + '\n' + content.slice(firstImportIndex);
  }

  // Add to apps array
  const appsArrayRegex = /const\s+apps\s*=\s*\[([^\]]*)\]/;
  const match = content.match(appsArrayRegex);
  if (!match) {
    throw new Error('Could not find apps array in ClientSync.tsx');
  }

  const existingApps = match[1].trim();
  const newAppsArray = existingApps
    ? `const apps = [${existingApps}, ${appId}]`
    : `const apps = [${appId}]`;

  content = content.replace(appsArrayRegex, newAppsArray);
  fs.writeFileSync(clientSyncPath, content);
}
