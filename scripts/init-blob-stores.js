#!/usr/bin/env node

/**
 * This script initializes all required Netlify blob stores for the application.
 * It should be run during deployment or setup to ensure all stores exist.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define all blob stores used in the application
const BLOB_STORES = [
  'users',
  'leads',
  'opportunities',
  'staff'
];

// Create a record of successfully initialized stores
const STORE_STATUS_FILE = path.join(__dirname, '../.blob-stores-initialized');

// Helper to run Netlify CLI commands
const runNetlifyCLI = (command) => {
  console.log(`Running: netlify ${command}`);
  try {
    const result = execSync(`netlify ${command}`, { encoding: 'utf8' });
    console.log(result);
    return { success: true, output: result };
  } catch (error) {
    console.error(`Error running command: netlify ${command}`);
    console.error(error.message);
    return { success: false, error };
  }
};

// Initialize a blob store
const initBlobStore = (storeName) => {
  console.log(`Initializing blob store: ${storeName}`);
  
  // First check if the store already exists by trying to list blobs in it
  const listResult = runNetlifyCLI(`blobs:list --name=${storeName}`);
  
  if (listResult.success && !listResult.output.includes('Error')) {
    console.log(`✅ Blob store ${storeName} already exists`);
    return true;
  }
  
  // Create a test blob to initialize the store
  console.log(`Creating test blob in store ${storeName}...`);
  const testContent = JSON.stringify({ 
    test: true, 
    createdAt: new Date().toISOString(),
    message: `Initialization of ${storeName} blob store`
  });
  
  // Write content to a temporary file
  const tempFile = path.join(__dirname, `temp-${storeName}-init.json`);
  fs.writeFileSync(tempFile, testContent);
  
  try {
    // Use the CLI to set the blob
    const setResult = runNetlifyCLI(`blobs:set init-test --path=${tempFile} --name=${storeName}`);
    
    if (!setResult.success) {
      console.error(`❌ Failed to initialize blob store ${storeName}`);
      return false;
    }
    
    console.log(`✅ Successfully initialized blob store ${storeName}`);
    return true;
  } finally {
    // Clean up the temporary file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
};

// Main function to initialize all stores
const initAllBlobStores = () => {
  console.log('🚀 Initializing all Netlify blob stores...');
  
  // Check if we've already run this successfully
  if (fs.existsSync(STORE_STATUS_FILE)) {
    const content = fs.readFileSync(STORE_STATUS_FILE, 'utf8');
    const data = JSON.parse(content);
    console.log(`Found existing initialization from ${data.timestamp}`);
    
    if (data.stores.length === BLOB_STORES.length && 
        BLOB_STORES.every(store => data.stores.includes(store))) {
      console.log('✅ All blob stores already initialized');
      return true;
    }
  }
  
  const results = {};
  let allSuccessful = true;
  
  for (const store of BLOB_STORES) {
    results[store] = initBlobStore(store);
    if (!results[store]) {
      allSuccessful = false;
    }
  }
  
  // Write status file for future reference
  const status = {
    timestamp: new Date().toISOString(),
    stores: Object.keys(results).filter(store => results[store]),
    complete: allSuccessful
  };
  
  fs.writeFileSync(STORE_STATUS_FILE, JSON.stringify(status, null, 2));
  
  console.log('\n📊 Initialization Results:');
  Object.entries(results).forEach(([store, success]) => {
    console.log(`${success ? '✅' : '❌'} ${store}`);
  });
  
  if (allSuccessful) {
    console.log('\n🎉 All blob stores successfully initialized!');
  } else {
    console.log('\n⚠️ Some blob stores failed to initialize. You may need to retry or use the fallback storage.');
  }
  
  return allSuccessful;
};

// Run the initialization
initAllBlobStores();
