/**
 * Unified database interface that selects the appropriate storage backend
 * based on configuration and availability.
 */

import { blobDb, User, Lead, Opportunity, Staff } from './blob-db';
import { db } from './db';
import { unifiedDb as fallbackDb, testConnections } from './fallback-storage';

// Configuration for storage fallback strategy
type StoragePriority = 'blob' | 'prisma' | 'neo4j';

interface StorageConfig {
  // Ordered list of storage backends to try
  priority: StoragePriority[];
  // Whether to auto-fallback when primary storage fails
  autoFallback: boolean;
  // Whether to log when falling back
  logFallbacks: boolean;
}

// Default storage configuration
const storageConfig: StorageConfig = {
  priority: ['blob', 'prisma', 'neo4j'],
  autoFallback: true, 
  logFallbacks: true
};

// Read environment variables or config if available
if (process.env.STORAGE_PRIORITY) {
  try {
    const priorityStr = process.env.STORAGE_PRIORITY;
    const priority = priorityStr.split(',') as StoragePriority[];
    if (priority.length > 0 && 
        priority.every(p => ['blob', 'prisma', 'neo4j'].includes(p))) {
      storageConfig.priority = priority;
    }
  } catch (e) {
    console.warn('Invalid STORAGE_PRIORITY env var, using default');
  }
}

if (process.env.STORAGE_AUTO_FALLBACK === 'false') {
  storageConfig.autoFallback = false;
}

// Track available storage backends
const availableBackends: {
  blob: boolean;
  prisma: boolean;
  neo4j: boolean;
} = {
  blob: false,
  prisma: false,
  neo4j: false
};

// Test all connections at startup
export const initializeStorage = async () => {
  console.log('Testing storage connections...');
  
  // Test Blob storage
  try {
    await blobDb.user.findMany();
    availableBackends.blob = true;
    console.log('✅ Netlify Blob storage is available');
  } catch (error) {
    console.log('❌ Netlify Blob storage is not available:', error.message);
    availableBackends.blob = false;
  }
  
  // Test Prisma
  try {
    await db.user.findMany();
    availableBackends.prisma = true;
    console.log('✅ Prisma database is available');
  } catch (error) {
    console.log('❌ Prisma database is not available:', error.message);
    availableBackends.prisma = false;
  }
  
  // Test Neo4j
  const { neo4j } = await testConnections();
  availableBackends.neo4j = neo4j;
  
  console.log('Storage availability:', availableBackends);
  return availableBackends;
};

// Helper to execute operation with fallback
const executeWithFallback = async <T>(
  operation: (dbSystem: any) => Promise<T>,
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (const backend of storageConfig.priority) {
    // Skip unavailable backends
    if (availableBackends[backend] === false) continue;
    
    try {
      switch (backend) {
        case 'blob':
          return await operation(blobDb);
        case 'prisma':
          return await operation(db);
        case 'neo4j':
          return await operation(fallbackDb);
        default:
          throw new Error(`Unknown backend: ${backend}`);
      }
    } catch (error) {
      if (storageConfig.logFallbacks) {
        console.log(`⚠️ Storage backend ${backend} failed, trying next option:`, error.message);
      }
      lastError = error;
      
      // Mark this backend as unavailable
      availableBackends[backend] = false;
      
      // If auto-fallback is disabled, don't try other backends
      if (!storageConfig.autoFallback) {
        throw error;
      }
    }
  }
  
  // If we get here, all backends failed
  throw lastError || new Error('All storage backends failed');
};

// Unified database object with fallback mechanism
export const unifiedDatabase = {
  // User operations
  user: {
    findMany: async () => executeWithFallback(db => db.user.findMany()),
    findById: async (id: string) => executeWithFallback(db => db.user.findById(id)),
    findByEmail: async (email: string) => executeWithFallback(db => db.user.findByEmail(email)),
    create: async (data: any) => executeWithFallback(db => db.user.create(data)),
    update: async (id: string, data: any) => executeWithFallback(db => db.user.update(id, data)),
    delete: async (id: string) => executeWithFallback(db => db.user.delete(id)),
  },
  
  // Lead operations
  lead: {
    findMany: async () => executeWithFallback(db => db.lead.findMany()),
    findById: async (id: string) => executeWithFallback(db => db.lead.findById(id)),
    create: async (data: any) => executeWithFallback(db => db.lead.create(data)),
    update: async (id: string, data: any) => executeWithFallback(db => db.lead.update(id, data)),
    delete: async (id: string) => executeWithFallback(db => db.lead.delete(id)),
  },
  
  // Opportunity operations
  opportunity: {
    findMany: async () => executeWithFallback(db => db.opportunity.findMany()),
    findById: async (id: string) => executeWithFallback(db => db.opportunity.findById(id)),
    findByLead: async (leadId: string) => executeWithFallback(db => db.opportunity.findByLead(leadId)),
    create: async (data: any) => executeWithFallback(db => db.opportunity.create(data)),
    update: async (id: string, data: any) => executeWithFallback(db => db.opportunity.update(id, data)),
    delete: async (id: string) => executeWithFallback(db => db.opportunity.delete(id)),
  },
  
  // Staff operations
  staff: {
    findMany: async () => executeWithFallback(db => db.staff.findMany()),
    findById: async (id: string) => executeWithFallback(db => db.staff.findById(id)),
    findByEmail: async (email: string) => executeWithFallback(db => db.staff.findByEmail(email)),
    create: async (data: any) => executeWithFallback(db => db.staff.create(data)),
    update: async (id: string, data: any) => executeWithFallback(db => db.staff.update(id, data)),
    delete: async (id: string) => executeWithFallback(db => db.staff.delete(id)),
  },
    // Analytics operations
  analytics: {
    getLeadsByStatus: async () => executeWithFallback(db => db.analytics.getLeadsByStatus()),
    getOpportunitiesByStage: async () => executeWithFallback(db => db.analytics.getOpportunitiesByStage()),
    getTotalRevenue: async () => executeWithFallback(db => db.analytics.getTotalRevenue()),    getUserStats: async () => {
      return executeWithFallback(async db => {
        // Use fallback directly since this method doesn't exist in all implementations
        return (fallbackDb.analytics as any).getUserStats ? 
          (fallbackDb.analytics as any).getUserStats() : 
          { activeUsers: 0, newUsersThisMonth: 0 };
      });
    },
  }
};

// Wrapper function for database operations with automatic fallback
export const withUnifiedDatabase = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  try {
    // Ensure storage is initialized
    if (Object.values(availableBackends).every(v => v === false)) {
      await initializeStorage();
    }
    
    console.log("Executing database operation with unified storage...");
    const result = await operation();
    console.log("Operation completed successfully");
    return result;
  } catch (error) {
    console.error('Database operation failed with all storage options:', error);
    throw error;
  }
};
