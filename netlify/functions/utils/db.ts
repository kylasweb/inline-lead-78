// Import the existing database utilities
import { db } from '../../../src/lib/db';

// Re-export all database utilities for use in Netlify Functions
export { db };

// Export types for use in functions
export type { User, Lead, Opportunity, Staff } from '../../../src/lib/db';

// Database connection wrapper for Netlify Functions
export const withDatabase = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  try {
    console.log("Connecting to the database...");
    const result = await operation();
    return result;
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  }
};