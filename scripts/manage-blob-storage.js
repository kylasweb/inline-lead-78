#!/usr/bin/env node
// filepath: d:\inline-lead-78\scripts\manage-blob-storage.js

/**
 * This script provides utilities for managing Netlify blob stores:
 * - Initialize stores
 * - List all data in stores
 * - Clean up stores
 * - Test storage with different payload sizes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Define all blob stores used in the application
const BLOB_STORES = [
  'users',
  'leads',
  'opportunities',
  'staff'
];

// Helper to run Netlify CLI commands with retries
const runNetlifyCLI = (command, attempts = 3) => {
  let lastError = null;
  
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      console.log(`Running: netlify ${command} (attempt ${attempt}/${attempts})`);
      const result = execSync(`netlify ${command}`, { encoding: 'utf8' });
      return { success: true, output: result };
    } catch (error) {
      lastError = error;
      
      // Check if it's a request size error
      if (error.message && error.message.includes('smaller request size') && attempt < attempts) {
        console.log(`Request size error, retrying with smaller chunks...`);
        continue;
      }
      
      console.error(`Error on attempt ${attempt}:`, error.message);
      
      if (attempt < attempts) {
        console.log(`Retrying in 1 second...`);
        execSync('sleep 1');
      }
    }
  }
  
  return { success: false, error: lastError };
};

// Generate a test payload of specified size
const generateTestPayload = (sizeInKB) => {
  const baseObj = {
    id: `test-${Date.now()}`,
    name: 'Test Object',
    timestamp: new Date().toISOString(),
    description: 'Generated test payload for Netlify Blobs size testing'
  };
  
  // Add data to reach desired size
  let filler = '';
  const sizePerChar = 1; // approximate size of a character in bytes
  const targetSize = sizeInKB * 1024;
  const neededChars = Math.max(0, targetSize - JSON.stringify(baseObj).length);
  
  for (let i = 0; i < neededChars; i++) {
    filler += String.fromCharCode(97 + (i % 26));
  }
  
  baseObj.data = filler;
  return baseObj;
};

// Test with different payload sizes
const testBlobSizes = async () => {
  console.log('🧪 Testing Netlify Blobs with different payload sizes');
  
  // Test sizes in KB
  const sizes = [10, 50, 100, 200, 500, 1000, 2000, 5000];
  const results = {};
  
  for (const size of sizes) {
    console.log(`\nTesting with ${size}KB payload...`);
    
    const payload = generateTestPayload(size);
    const tempFile = path.join(__dirname, `temp-${size}kb-test.json`);
    
    // Write the test data to a file
    fs.writeFileSync(tempFile, JSON.stringify(payload));
    
    try {
      // Try to upload the file
      console.log(`Uploading ${size}KB file to blob storage...`);
      const sizeStr = size.toString().padStart(5, '0');
      const key = `size-test-${sizeStr}kb`;
      
      const result = runNetlifyCLI(`blobs:set ${key} --path=${tempFile} --name=test-store`);
      
      results[size] = {
        success: result.success,
        error: result.success ? null : 'Upload failed',
        output: result.success ? 'Success' : result.error?.message
      };
      
      if (result.success) {
        console.log(`✅ ${size}KB upload successful`);
        
        // Try to retrieve it
        const getResult = runNetlifyCLI(`blobs:get ${key} --name=test-store`);
        results[size].retrieved = getResult.success;
        
        if (getResult.success) {
          console.log(`✅ ${size}KB retrieval successful`);
        } else {
          console.log(`❌ ${size}KB retrieval failed`);
        }
        
        // Clean up
        runNetlifyCLI(`blobs:delete ${key} --name=test-store`);
      } else {
        console.log(`❌ ${size}KB upload failed`);
      }
    } catch (error) {
      console.error(`Error testing ${size}KB:`, error);
      results[size] = { 
        success: false,
        error: error.message,
        output: error.toString()
      };
    } finally {
      // Clean up the temporary file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }
  
  console.log('\n📊 Results Summary:');
  for (const [size, result] of Object.entries(results)) {
    console.log(`${result.success ? '✅' : '❌'} ${size}KB: ${result.success ? 'Success' : 'Failed'}`);
  }
  
  const maxSuccessfulSize = Math.max(...Object.entries(results)
    .filter(([_, result]) => result.success)
    .map(([size]) => parseInt(size)));
  
  console.log(`\n📏 Maximum successful upload size: ${maxSuccessfulSize}KB`);
  console.log(`💡 Recommendation: Use chunk size of ${Math.floor(maxSuccessfulSize * 0.8)}KB for reliability`);
  
  // Save results to file
  const resultsFile = path.join(__dirname, 'blob-size-test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    maxSuccessfulSize,
    recommendedChunkSize: Math.floor(maxSuccessfulSize * 0.8)
  }, null, 2));
  
  console.log(`\nDetailed results saved to: ${resultsFile}`);
};

// Test compression effectiveness
const testCompression = async () => {
  console.log('🧪 Testing compression effectiveness for Netlify Blobs');
  
  // Generate sample data of different types
  const testData = [
    { 
      type: 'simple-text', 
      data: { text: 'A'.repeat(5000) } 
    },
    { 
      type: 'repeated-object',
      data: Array(100).fill(0).map((_, i) => ({ id: i, name: `Item ${i}`, status: 'active' }))
    },
    { 
      type: 'mixed-content',
      data: {
        users: Array(20).fill(0).map((_, i) => ({ 
          id: `user-${i}`, 
          name: `User ${i}`,
          email: `user${i}@example.com`,
          role: i % 3 === 0 ? 'admin' : 'user'
        })),
        settings: {
          theme: 'dark',
          notifications: true,
          language: 'en',
          preferences: { autoSave: true, fontSize: 14, colors: { primary: '#ff00ff', secondary: '#00ffff' } }
        },
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100)
      }
    },
    {
      type: 'deeply-nested',
      data: (function generateNested(depth, breadth) {
        if (depth <= 0) return { value: Math.random() };
        
        const obj = {};
        for (let i = 0; i < breadth; i++) {
          obj[`item${i}`] = generateNested(depth - 1, breadth);
        }
        return obj;
      })(5, 3)
    }
  ];
  
  console.log('\n📊 Compression Results:');
  console.log('-'.repeat(80));
  console.log('| Type             | Original Size | Compressed Size | Ratio  | Savings |');
  console.log('|------------------|--------------|----------------|--------|---------|');
  
  for (const test of testData) {
    const serialized = JSON.stringify(test.data);
    const originalSize = serialized.length;
    
    const compressed = zlib.deflateSync(serialized);
    const compressedSize = compressed.length;
    
    const ratio = (compressedSize / originalSize * 100).toFixed(2);
    const savings = (100 - parseFloat(ratio)).toFixed(2);
    
    console.log(`| ${test.type.padEnd(16)} | ${originalSize.toString().padEnd(12)} | ${compressedSize.toString().padEnd(14)} | ${ratio}% | ${savings}% |`);
  }
  
  console.log('-'.repeat(80));
  console.log('\n💡 Recommendation: Use compression for all objects larger than 50KB');
};

// List all blobs in all stores
const listAllBlobs = async () => {
  console.log('📋 Listing all blobs in all stores');
  
  for (const store of BLOB_STORES) {
    console.log(`\nStore: ${store}`);
    console.log('-'.repeat(50));
    
    const result = runNetlifyCLI(`blobs:list --name=${store}`);
    
    if (result.success) {
      console.log(result.output);
    } else {
      console.log(`❌ Failed to list blobs in ${store} store`);
    }
  }
};

// Clean up test blobs
const cleanupTestBlobs = async () => {
  console.log('🧹 Cleaning up test blobs');
  
  for (const store of BLOB_STORES) {
    console.log(`\nStore: ${store}`);
    
    const listResult = runNetlifyCLI(`blobs:list --name=${store}`);
    
    if (!listResult.success) {
      console.log(`❌ Failed to list blobs in ${store} store`);
      continue;
    }
    
    // Find test blobs
    const lines = listResult.output.split('\n');
    const testBlobs = lines.filter(line => 
      line.includes('test-') || 
      line.includes('init-test') ||
      line.includes('size-test')
    );
    
    console.log(`Found ${testBlobs.length} test blobs to clean up`);
    
    for (const blob of testBlobs) {
      // Extract blob key
      const matches = blob.match(/^\s*(\S+)/);
      if (matches && matches[1]) {
        const key = matches[1];
        console.log(`Deleting ${key}...`);
        
        const deleteResult = runNetlifyCLI(`blobs:delete ${key} --name=${store}`);
        
        if (deleteResult.success) {
          console.log(`✅ Deleted ${key}`);
        } else {
          console.log(`❌ Failed to delete ${key}`);
        }
      }
    }
  }
};

// Show help
const showHelp = () => {
  console.log(`
Netlify Blob Storage Management Utility

Usage:
  node ${path.basename(__filename)} <command>

Commands:
  init               Initialize all blob stores
  list               List all blobs in all stores
  test-sizes         Test blob storage with different payload sizes
  test-compression   Test compression effectiveness
  cleanup            Clean up test blobs
  help               Show this help message
  `);
};

// Main function
const main = () => {
  const command = process.argv[2] || 'help';
  
  switch (command) {
    case 'init':
      // Use the existing init-blob-stores.js script
      require('./init-blob-stores.js');
      break;
      
    case 'list':
      listAllBlobs();
      break;
      
    case 'test-sizes':
      testBlobSizes();
      break;
      
    case 'test-compression':
      testCompression();
      break;
      
    case 'cleanup':
      cleanupTestBlobs();
      break;
      
    case 'help':
    default:
      showHelp();
      break;
  }
};

// Run the script
main();
