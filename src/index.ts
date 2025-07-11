#!/usr/bin/env node

import { main } from './server-aws.js';

const PARTITION = process.env.AWS_DOCUMENTATION_PARTITION?.toLowerCase() || 'aws';

async function runServer() {
  if (PARTITION === 'aws') {
    await main();
  } else if (PARTITION === 'aws-cn') {
    // AWS China region support (will be implemented later)
    console.error('AWS China region is not yet implemented');
    process.exit(1);
  } else {
    console.error(`Unsupported AWS documentation partition: ${PARTITION}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runServer().catch((error) => {
    console.error('Error running server:', error);
    process.exit(1);
  });
}