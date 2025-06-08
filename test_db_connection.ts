import { testConnection } from './src/lib/db';

async function main() {
  const isConnected = await testConnection();
  console.log('Database connection status:', isConnected);
}

main();