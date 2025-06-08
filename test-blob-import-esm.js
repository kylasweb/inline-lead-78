// Test file to verify @netlify/blobs import works with ES6 imports
try {
  // Try dynamic import since we're in ESM mode
  const { getBlob, setBlob } = await import('@netlify/blobs');
  console.log('✅ Successfully imported @netlify/blobs with ES6 import');
  console.log('Available functions:', { getBlob: typeof getBlob, setBlob: typeof setBlob });
} catch (error) {
  console.log('❌ Failed to import @netlify/blobs:', error.message);
  console.log('Error details:', error);
}