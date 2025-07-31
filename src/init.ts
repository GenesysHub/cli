import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import readline from 'readline';

// Configuration - ADJUST THESE TO MATCH YOUR REPO
const DEBUG_MODE = false;
const TEMPLATE_REPO = 'https://github.com/GenesysHub/project_template.git';
const DEFAULT_PROJECT_NAME = 'test-project';
const DEFAULT_TARGET_DIR = path.join(os.homedir(), 'Documents', 'TEST');

async function promptToContinue(stepName: string) {
  if (!DEBUG_MODE) return;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<void>((resolve) => {
    rl.question(`Continue with "${stepName}"? (y/n) `, (answer) => {
      rl.close();
      if (answer.toLowerCase() !== 'y') {
        console.log('Operation cancelled by user');
        process.exit(0);
      }
      resolve();
    });
  });
}

function askQuestion(question: string): Promise<string> {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise<string>(resolve => {
        rl.question(question, (answer: string) => {
            rl.close();
            resolve(answer);
        });
    });
}

export async function init(rawArgs: string[]) {
  // Parse project name
  let projectName = DEFAULT_PROJECT_NAME;
  for (const arg of rawArgs) {
    if (!arg.startsWith('-') && !arg.includes('=')) {
      projectName = arg;
      break;
    }
  }

  const targetDir = path.join(DEFAULT_TARGET_DIR, projectName);
  const tempDir = path.join(os.tmpdir(), `genesys-template-${Date.now()}`);

  console.log(`\n=== Initializing project: ${projectName} ===`);

  try {
    // STEP 1: Clone repository
    console.log('\n[1/7] Cloning template repository...');
    await promptToContinue('Clone repository');
    execSync(`git clone ${TEMPLATE_REPO} ${tempDir}`, { stdio: 'inherit' });

    // Debug: Show cloned structure
    if (DEBUG_MODE) {
      console.log('\nRepository contents:');
      execSync(`ls -la ${tempDir}`, { stdio: 'inherit' });
    }

    // STEP 2: Verify template exists
    console.log('\n[2/7] Verifying template structure...');
    const templateDir = path.join(tempDir);
    await promptToContinue('Verify template');

    // STEP 3: Prepare target directory
    console.log('\n[3/7] Preparing target directory...');
    if (fs.existsSync(targetDir)) {
      console.log(`Removing existing directory: ${targetDir}`);
      fs.removeSync(targetDir);
    }
    fs.mkdirSync(targetDir, { recursive: true });
    await promptToContinue('Create target directory');

    // STEP 4: Copy template
    console.log('\n[4/7] Copying project files...');
    console.log(`From: ${templateDir}`);
    console.log(`To: ${targetDir}`);
    await promptToContinue('Copy files');
    fs.copySync(templateDir, targetDir);

    // Debug: Show copied files
    if (DEBUG_MODE) {
      console.log('\nCopied files:');
      execSync(`find ${targetDir} -maxdepth 2`, { stdio: 'inherit' });
    }
    // STEP 5: Initialize git
    console.log('\n[5/7] Initializing git repository...');
    await promptToContinue('Initialize git');
    execSync('git init', { cwd: targetDir, stdio: 'inherit' });

    console.log('@GenesysHub packages are currently private. You need .npmrc to install deps.');

    // STEP 6: Ask to install dependencies
    const shouldInstall = await askQuestion('\n[6/7] Do you want to install dependencies with bun? (y/n) ');
    if (shouldInstall.toLowerCase() === 'y') {
      console.log('Installing dependencies...');
      execSync('bun install', { cwd: targetDir, stdio: 'inherit' });

      // STEP 7: Ask how to run the project
      const runOption = await askQuestion('\n[7/7] How do you want to run the project?\n' +
        '1. Run production build (bun run build -> bun run start)\n' +
        '2. Run development server (bun run dev)\n' +
        '3. Do nothing\n' +
        'Enter your choice (1-3): ');

      switch (runOption) {
        case '1':
          console.log('Building production version...');
          execSync('bun run build', { cwd: targetDir, stdio: 'inherit' });
          console.log('Starting production server...');
          execSync('bun run start', { cwd: targetDir, stdio: 'inherit' });
          break;
        case '2':
          console.log('Starting development server...');
          execSync('bun run dev', { cwd: targetDir, stdio: 'inherit' });
          break;
        default:
          console.log('Skipping running the project.');
      }
    } else {
      console.log('Skipping dependency installation.');
    }

    console.log(`\n✅ Success! Project created in: ${targetDir}`);
    console.log('\nYou can now run the project manually when ready.');

    console.log(`\n✅ Success! Project created in: ${targetDir}`);
    console.log('\nProject is now running! You can access it in your browser.');
  } catch (error) {
    console.error('\n❌ Initialization failed:');
    //@ts-ignore
    console.error(error.message || error);

    // Clean up
    try {
      if (fs.existsSync(targetDir)) fs.removeSync(targetDir);
      if (fs.existsSync(tempDir)) fs.removeSync(tempDir);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    process.exit(1);
  } finally {
    try {
      if (fs.existsSync(tempDir)) fs.removeSync(tempDir);
    } catch (e) { }
  }
}
