import { init } from './init';
import { add } from './add';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'init') {
    await init(args.slice(1));
  } else if (command === 'add') {
    await add(args.slice(1));
  } else {
    console.log('Usage: genesys <command>');
    console.log('Commands:');
    console.log('  init [name="test-project"] - Initialize a new project');
    console.log('  add - Add component (not implemented)');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});