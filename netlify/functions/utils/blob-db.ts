import fetch from 'node-fetch';
import { getStore } from '@netlify/blobs';
import { 
  getSerializedSize, 
  SIZE_LIMITS, 
  storeInChunks, 
  getFromChunks, 
  deleteChunkedData 
} from './blob-size-utils';

// Initialize blob stores for each entity type
const getUserStore = () => getStore({ name: 'users', fetch: fetch as unknown as typeof global.fetch });
const getLeadStore = () => getStore({ name: 'leads', fetch: fetch as unknown as typeof global.fetch });
const getOpportunityStore = () => getStore({ name: 'opportunities', fetch: fetch as unknown as typeof global.fetch });
const getStaffStore = () => getStore({ name: 'staff', fetch: fetch as unknown as typeof global.fetch });

// Type definitions
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  status: string;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  amount: number;
  stage: string;
  leadId: string;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Staff {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string | null;
  phone?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

// Helper function to get all items from a store
async function getAllFromStore<T>(store: any): Promise<T[]> {
  try {
    console.log("getAllFromStore: Listing blobs...");
    const { blobs } = await store.list();
    console.log("getAllFromStore: Blobs listed successfully.", blobs);
    
    // Filter out metadata and chunk blobs
    const validBlobs = blobs.filter(blob => 
      !blob.key.startsWith('_meta_') && 
      !blob.key.includes('_chunk_') && 
      !blob.key.endsWith('_compressed')
    );
    
    const items: T[] = [];
    
    for (const blob of validBlobs) {
      try {
        console.log(`getAllFromStore: Getting data for blob ${blob.key}...`);
        // Use our optimized chunk retrieval function
        const data = await getFromChunks<T>(store, blob.key);
        
        if (data) {
          console.log(`getAllFromStore: Successfully retrieved data for blob ${blob.key}.`);
          items.push(data);
        }
      } catch (error) {
        console.warn(`Failed to parse blob ${blob.key}:`, error);
      }
    }
    
    return items;
  } catch (error) {
    console.error('Error fetching from store:', error);
    return [];
  }
}

// Helper function to find item by ID
async function findById<T extends { id: string }>(store: any, id: string): Promise<T | null> {
  try {
    // Try to get data with our chunking-aware function
    const data = await getFromChunks<T>(store, id);
    return data || null;
  } catch (error) {
    console.error(`Error finding item by ID ${id}:`, error);
    return null;
  }
}

// Helper function to find items by field value
async function findBy<T>(store: any, fieldName: string, value: any): Promise<T[]> {
  const allItems = await getAllFromStore<T>(store);
  return allItems.filter((item: any) => item[fieldName] === value);
}

// Database utility functions for Netlify Blobs
export const blobDb = {
  // User operations
  user: {
    findMany: async (): Promise<User[]> => {
      const store = getUserStore();
      return getAllFromStore<User>(store);
    },
    
    findById: async (id: string): Promise<User | null> => {
      const store = getUserStore();
      return findById<User>(store, id);
    },
    
    findByEmail: async (email: string): Promise<User | null> => {
      const store = getUserStore();
      const users = await findBy<User>(store, 'email', email);
      return users.length > 0 ? users[0] : null;
    },
    
    create: async (data: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
      const store = getUserStore();
      const user: User = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      
      // Check size before storing
      const serializedSize = getSerializedSize(user);
      
      if (serializedSize > SIZE_LIMITS.WARNING_THRESHOLD) {
        console.warn(`Large user object (${serializedSize} bytes) detected.`);
      }
      
      // Use the chunking mechanism for storage
      await storeInChunks(store, user.id, user);
      return user;
    },
    
    update: async (id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> => {
      const store = getUserStore();
      const existing = await findById<User>(store, id);
      if (!existing) return null;
      
      const updated: User = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      // Use the chunking mechanism for storage
      await storeInChunks(store, id, updated);
      return updated;
    },
    
    delete: async (id: string): Promise<boolean> => {
      const store = getUserStore();
      try {
        return await deleteChunkedData(store, id);
      } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        return false;
      }
    },
  },

  // Lead operations
  lead: {
    findMany: async (): Promise<Lead[]> => {
      const store = getLeadStore();
      return getAllFromStore<Lead>(store);
    },
    
    findById: async (id: string): Promise<Lead | null> => {
      const store = getLeadStore();
      return findById<Lead>(store, id);
    },
    
    create: async (data: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> => {
      const store = getLeadStore();
      const lead: Lead = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      
      // Use the chunking mechanism for storage
      await storeInChunks(store, lead.id, lead);
      return lead;
    },
    
    update: async (id: string, data: Partial<Omit<Lead, 'id' | 'createdAt'>>): Promise<Lead | null> => {
      const store = getLeadStore();
      const existing = await findById<Lead>(store, id);
      if (!existing) return null;
      
      const updated: Lead = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      // Use the chunking mechanism for storage
      await storeInChunks(store, id, updated);
      return updated;
    },
    
    delete: async (id: string): Promise<boolean> => {
      const store = getLeadStore();
      try {
        return await deleteChunkedData(store, id);
      } catch (error) {
        console.error(`Error deleting lead ${id}:`, error);
        return false;
      }
    },
  },

  // Opportunity operations
  opportunity: {
    findMany: async (): Promise<Opportunity[]> => {
      const store = getOpportunityStore();
      return getAllFromStore<Opportunity>(store);
    },
    
    findById: async (id: string): Promise<Opportunity | null> => {
      const store = getOpportunityStore();
      return findById<Opportunity>(store, id);
    },
    
    findByLead: async (leadId: string): Promise<Opportunity[]> => {
      const store = getOpportunityStore();
      return findBy<Opportunity>(store, 'leadId', leadId);
    },
    
    create: async (data: Omit<Opportunity, 'id' | 'createdAt'>): Promise<Opportunity> => {
      const store = getOpportunityStore();
      const opportunity: Opportunity = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      
      // Use the chunking mechanism for storage
      await storeInChunks(store, opportunity.id, opportunity);
      return opportunity;
    },
    
    update: async (id: string, data: Partial<Omit<Opportunity, 'id' | 'createdAt'>>): Promise<Opportunity | null> => {
      const store = getOpportunityStore();
      const existing = await findById<Opportunity>(store, id);
      if (!existing) return null;
      
      const updated: Opportunity = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      // Use the chunking mechanism for storage
      await storeInChunks(store, id, updated);
      return updated;
    },
    
    delete: async (id: string): Promise<boolean> => {
      const store = getOpportunityStore();
      try {
        return await deleteChunkedData(store, id);
      } catch (error) {
        console.error(`Error deleting opportunity ${id}:`, error);
        return false;
      }
    },
  },

  // Staff operations
  staff: {
    findMany: async (): Promise<Staff[]> => {
      const store = getStaffStore();
      return getAllFromStore<Staff>(store);
    },
    
    findById: async (id: string): Promise<Staff | null> => {
      const store = getStaffStore();
      return findById<Staff>(store, id);
    },
    
    findByEmail: async (email: string): Promise<Staff | null> => {
      const store = getStaffStore();
      const staff = await findBy<Staff>(store, 'email', email);
      return staff.length > 0 ? staff[0] : null;
    },
    
    create: async (data: Omit<Staff, 'id' | 'createdAt'>): Promise<Staff> => {
      const store = getStaffStore();
      const staff: Staff = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      
      // Use the chunking mechanism for storage
      await storeInChunks(store, staff.id, staff);
      return staff;
    },
    
    update: async (id: string, data: Partial<Omit<Staff, 'id' | 'createdAt'>>): Promise<Staff | null> => {
      const store = getStaffStore();
      const existing = await findById<Staff>(store, id);
      if (!existing) return null;
      
      const updated: Staff = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      // Use the chunking mechanism for storage
      await storeInChunks(store, id, updated);
      return updated;
    },
    
    delete: async (id: string): Promise<boolean> => {
      const store = getStaffStore();
      try {
        return await deleteChunkedData(store, id);
      } catch (error) {
        console.error(`Error deleting staff ${id}:`, error);
        return false;
      }
    },
  },

  // Analytics operations
  analytics: {
    getLeadsByStatus: async () => {
      const leads = await blobDb.lead.findMany();
      const statusCounts: Record<string, number> = {};
      
      leads.forEach(lead => {
        statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
      });
      
      return Object.entries(statusCounts).map(([status, count]) => ({
        status,
        _count: { status: count }
      }));
    },
    
    getOpportunitiesByStage: async () => {
      const opportunities = await blobDb.opportunity.findMany();
      const stageCounts: Record<string, { count: number; totalValue: number }> = {};
      
      opportunities.forEach(opp => {
        if (!stageCounts[opp.stage]) {
          stageCounts[opp.stage] = { count: 0, totalValue: 0 };
        }
        stageCounts[opp.stage].count += 1;
        stageCounts[opp.stage].totalValue += opp.amount;
      });
      
      return Object.entries(stageCounts).map(([stage, data]) => ({
        stage,
        _count: { stage: data.count },
        _sum: { amount: data.totalValue }
      }));
    },
    
    getTotalRevenue: async () => {
      const opportunities = await blobDb.opportunity.findMany();
      const totalAmount = opportunities.reduce((sum, opp) => sum + opp.amount, 0);
      
      return {
        _sum: { amount: totalAmount }
      };
    },
    
    getUserStats: async () => {
      const [users, leads, opportunities] = await Promise.all([
        blobDb.user.findMany(),
        blobDb.lead.findMany(),
        blobDb.opportunity.findMany()
      ]);
      
      return users.map(user => {
        const assignedLeads = leads.filter(lead => lead.assignedTo === user.id);
        const assignedOpportunities = opportunities.filter(opp => opp.assignedTo === user.id);
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          _count: {
            assignedLeads: assignedLeads.length,
            assignedOpportunities: assignedOpportunities.length
          }
        };
      });
    },
  }
};

// Database connection wrapper for blob operations
export const withBlobDatabase = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  try {
    console.log("Executing blob database operation...");
    const result = await operation();
    console.log("withBlobDatabase: Operation completed successfully.");
    return result;
  } catch (error) {
    console.error('withBlobDatabase: Blob database operation failed:', error);
    throw error;
  }
};