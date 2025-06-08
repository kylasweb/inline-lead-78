// Test file to verify @netlify/blobs import works
try {
  const { getBlob, setBlob } = require('@netlify/blobs');
  console.log('✅ Successfully imported @netlify/blobs');
  console.log('Available functions:', { getBlob: typeof getBlob, setBlob: typeof setBlob });
} catch (error) {
  console.log('❌ Failed to import @netlify/blobs:', error.message);
  console.log('Error details:', error);
}