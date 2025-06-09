import neo4j, { Driver } from 'neo4j-driver';
import { blobDb, User, Lead, Opportunity, Staff } from './blob-db';

// Initialize Neo4j driver
let driver: Driver | null = null;

// Initialize Neo4j connection
export const initNeo4j = () => {
  try {
    const uri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';
    
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 5000,
    });
    
    console.log('✅ Neo4j driver initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Neo4j driver:', error);
    return false;
  }
};

// Close Neo4j connection
export const closeNeo4j = async () => {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('Neo4j connection closed');
  }
};

// Run a Neo4j query
const runQuery = async<T>(cypher: string, params = {}): Promise<T[]> => {
  if (!driver) {
    initNeo4j();
  }
  
  if (!driver) {
    throw new Error('Neo4j driver not initialized');
  }
  
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map(record => {
      const node = record.get(0);
      return { ...node.properties, id: node.properties.id } as T;
    });
  } finally {
    await session.close();
  }
};

// Neo4j database utility functions
export const neo4jDb = {
  // User operations
  user: {
    findMany: async (): Promise<User[]> => {
      return runQuery<User>('MATCH (u:User) RETURN u');
    },
    
    findById: async (id: string): Promise<User | null> => {
      const users = await runQuery<User>('MATCH (u:User {id: $id}) RETURN u', { id });
      return users.length > 0 ? users[0] : null;
    },
    
    findByEmail: async (email: string): Promise<User | null> => {
      const users = await runQuery<User>('MATCH (u:User {email: $email}) RETURN u', { email });
      return users.length > 0 ? users[0] : null;
    },
    
    create: async (data: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
      const user: User = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      
      await runQuery(
        'CREATE (u:User $props) RETURN u',
        { props: user }
      );
      
      return user;
    },
    
    update: async (id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> => {
      const existing = await neo4jDb.user.findById(id);
      if (!existing) return null;
      
      const updated: User = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      await runQuery(
        'MATCH (u:User {id: $id}) SET u = $props RETURN u',
        { id, props: updated }
      );
      
      return updated;
    },
    
    delete: async (id: string): Promise<boolean> => {
      await runQuery('MATCH (u:User {id: $id}) DELETE u', { id });
      return true;
    },
  },

  // Lead operations  
  lead: {
    findMany: async (): Promise<Lead[]> => {
      return runQuery<Lead>('MATCH (l:Lead) RETURN l');
    },
    
    findById: async (id: string): Promise<Lead | null> => {
      const leads = await runQuery<Lead>('MATCH (l:Lead {id: $id}) RETURN l', { id });
      return leads.length > 0 ? leads[0] : null;
    },
    
    create: async (data: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> => {
      const lead: Lead = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      
      await runQuery(
        'CREATE (l:Lead $props) RETURN l',
        { props: lead }
      );
      
      return lead;
    },
    
    update: async (id: string, data: Partial<Omit<Lead, 'id' | 'createdAt'>>): Promise<Lead | null> => {
      const existing = await neo4jDb.lead.findById(id);
      if (!existing) return null;
      
      const updated: Lead = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      await runQuery(
        'MATCH (l:Lead {id: $id}) SET l = $props RETURN l',
        { id, props: updated }
      );
      
      return updated;
    },
    
    delete: async (id: string): Promise<boolean> => {
      await runQuery('MATCH (l:Lead {id: $id}) DELETE l', { id });
      return true;
    },
  },

  // Opportunity operations
  opportunity: {
    findMany: async (): Promise<Opportunity[]> => {
      return runQuery<Opportunity>('MATCH (o:Opportunity) RETURN o');
    },
    
    findById: async (id: string): Promise<Opportunity | null> => {
      const opportunities = await runQuery<Opportunity>('MATCH (o:Opportunity {id: $id}) RETURN o', { id });
      return opportunities.length > 0 ? opportunities[0] : null;
    },
    
    findByLead: async (leadId: string): Promise<Opportunity[]> => {
      return runQuery<Opportunity>('MATCH (o:Opportunity {leadId: $leadId}) RETURN o', { leadId });
    },
    
    create: async (data: Omit<Opportunity, 'id' | 'createdAt'>): Promise<Opportunity> => {
      const opportunity: Opportunity = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      
      await runQuery(
        'CREATE (o:Opportunity $props) RETURN o',
        { props: opportunity }
      );
      
      return opportunity;
    },
    
    update: async (id: string, data: Partial<Omit<Opportunity, 'id' | 'createdAt'>>): Promise<Opportunity | null> => {
      const existing = await neo4jDb.opportunity.findById(id);
      if (!existing) return null;
      
      const updated: Opportunity = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      await runQuery(
        'MATCH (o:Opportunity {id: $id}) SET o = $props RETURN o',
        { id, props: updated }
      );
      
      return updated;
    },
    
    delete: async (id: string): Promise<boolean> => {
      await runQuery('MATCH (o:Opportunity {id: $id}) DELETE o', { id });
      return true;
    },
  },

  // Staff operations
  staff: {
    findMany: async (): Promise<Staff[]> => {
      return runQuery<Staff>('MATCH (s:Staff) RETURN s');
    },
    
    findById: async (id: string): Promise<Staff | null> => {
      const staff = await runQuery<Staff>('MATCH (s:Staff {id: $id}) RETURN s', { id });
      return staff.length > 0 ? staff[0] : null;
    },
    
    findByEmail: async (email: string): Promise<Staff | null> => {
      const staff = await runQuery<Staff>('MATCH (s:Staff {email: $email}) RETURN s', { email });
      return staff.length > 0 ? staff[0] : null;
    },
    
    create: async (data: Omit<Staff, 'id' | 'createdAt'>): Promise<Staff> => {
      const staff: Staff = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      
      await runQuery(
        'CREATE (s:Staff $props) RETURN s',
        { props: staff }
      );
      
      return staff;
    },
    
    update: async (id: string, data: Partial<Omit<Staff, 'id' | 'createdAt'>>): Promise<Staff | null> => {
      const existing = await neo4jDb.staff.findById(id);
      if (!existing) return null;
      
      const updated: Staff = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      await runQuery(
        'MATCH (s:Staff {id: $id}) SET s = $props RETURN s',
        { id, props: updated }
      );
      
      return updated;
    },
    
    delete: async (id: string): Promise<boolean> => {
      await runQuery('MATCH (s:Staff {id: $id}) DELETE s', { id });
      return true;
    },
  },
};

// Unified database with fallback mechanism
export const unifiedDb = {
  user: {
    findMany: async () => {
      try {
        return await blobDb.user.findMany();
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.user.findMany();
      }
    },
    findById: async (id: string) => {
      try {
        return await blobDb.user.findById(id);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.user.findById(id);
      }
    },
    findByEmail: async (email: string) => {
      try {
        return await blobDb.user.findByEmail(email);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.user.findByEmail(email);
      }
    },
    create: async (data: Omit<User, 'id' | 'createdAt'>) => {
      try {
        return await blobDb.user.create(data);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.user.create(data);
      }
    },
    update: async (id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>) => {
      try {
        return await blobDb.user.update(id, data);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.user.update(id, data);
      }
    },
    delete: async (id: string) => {
      try {
        return await blobDb.user.delete(id);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.user.delete(id);
      }
    },
  },
  
  lead: {
    findMany: async () => {
      try {
        return await blobDb.lead.findMany();
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.lead.findMany();
      }
    },
    findById: async (id: string) => {
      try {
        return await blobDb.lead.findById(id);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.lead.findById(id);
      }
    },
    create: async (data: Omit<Lead, 'id' | 'createdAt'>) => {
      try {
        return await blobDb.lead.create(data);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.lead.create(data);
      }
    },
    update: async (id: string, data: Partial<Omit<Lead, 'id' | 'createdAt'>>) => {
      try {
        return await blobDb.lead.update(id, data);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.lead.update(id, data);
      }
    },
    delete: async (id: string) => {
      try {
        return await blobDb.lead.delete(id);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.lead.delete(id);
      }
    },
  },
  
  opportunity: {
    findMany: async () => {
      try {
        return await blobDb.opportunity.findMany();
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.opportunity.findMany();
      }
    },
    findById: async (id: string) => {
      try {
        return await blobDb.opportunity.findById(id);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.opportunity.findById(id);
      }
    },
    findByLead: async (leadId: string) => {
      try {
        return await blobDb.opportunity.findByLead(leadId);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.opportunity.findByLead(leadId);
      }
    },
    create: async (data: Omit<Opportunity, 'id' | 'createdAt'>) => {
      try {
        return await blobDb.opportunity.create(data);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.opportunity.create(data);
      }
    },
    update: async (id: string, data: Partial<Omit<Opportunity, 'id' | 'createdAt'>>) => {
      try {
        return await blobDb.opportunity.update(id, data);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.opportunity.update(id, data);
      }
    },
    delete: async (id: string) => {
      try {
        return await blobDb.opportunity.delete(id);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.opportunity.delete(id);
      }
    },
  },
  
  staff: {
    findMany: async () => {
      try {
        return await blobDb.staff.findMany();
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.staff.findMany();
      }
    },
    findById: async (id: string) => {
      try {
        return await blobDb.staff.findById(id);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.staff.findById(id);
      }
    },
    findByEmail: async (email: string) => {
      try {
        return await blobDb.staff.findByEmail(email);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.staff.findByEmail(email);
      }
    },
    create: async (data: Omit<Staff, 'id' | 'createdAt'>) => {
      try {
        return await blobDb.staff.create(data);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.staff.create(data);
      }
    },
    update: async (id: string, data: Partial<Omit<Staff, 'id' | 'createdAt'>>) => {
      try {
        return await blobDb.staff.update(id, data);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.staff.update(id, data);
      }
    },
    delete: async (id: string) => {
      try {
        return await blobDb.staff.delete(id);
      } catch (error) {
        console.log('⚠️ Blob storage access failed, falling back to Neo4j:', error);
        return neo4jDb.staff.delete(id);
      }
    },
  },
  
  // Analytics operations with fallback
  analytics: {
    getLeadsByStatus: async () => {
      try {
        return await blobDb.analytics.getLeadsByStatus();
      } catch (error) {
        console.log('⚠️ Blob storage analytics failed, falling back to Neo4j');
        const leads = await neo4jDb.lead.findMany();
        const statusCounts: Record<string, number> = {};
        
        leads.forEach(lead => {
          statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
        });
        
        return Object.entries(statusCounts).map(([status, count]) => ({
          status,
          _count: { status: count }
        }));
      }
    },
    
    getOpportunitiesByStage: async () => {
      try {
        return await blobDb.analytics.getOpportunitiesByStage();
      } catch (error) {
        console.log('⚠️ Blob storage analytics failed, falling back to Neo4j');
        const opportunities = await neo4jDb.opportunity.findMany();
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
      }
    },
    
    getTotalRevenue: async () => {
      try {
        return await blobDb.analytics.getTotalRevenue();
      } catch (error) {
        console.log('⚠️ Blob storage analytics failed, falling back to Neo4j');
        const opportunities = await neo4jDb.opportunity.findMany();
        const totalAmount = opportunities.reduce((sum, opp) => sum + opp.amount, 0);
        
        return {
          _sum: { amount: totalAmount }
        };
      }
    },
  }
};

// Database connection wrapper with fallback
export const withFallbackDatabase = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  try {
    console.log("Executing database operation with fallback mechanism...");
    const result = await operation();
    console.log("Operation completed successfully");
    return result;
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  } finally {
    // Close Neo4j connection if it was used
    if (driver) {
      await closeNeo4j();
    }
  }
};

// Test connection to both blob storage and Neo4j
export const testConnections = async (): Promise<{blob: boolean, neo4j: boolean}> => {
  // Test Blob storage
  let blobConnected = false;
  try {
    const users = await blobDb.user.findMany();
    console.log(`✅ Blob storage connected successfully. Found ${users.length} users.`);
    blobConnected = true;
  } catch (error) {
    console.error('❌ Blob storage connection failed:', error);
  }
  
  // Test Neo4j
  let neo4jConnected = false;
  try {
    await initNeo4j();
    if (driver) {
      await driver.verifyConnectivity();
      console.log('✅ Neo4j connected successfully');
      neo4jConnected = true;
    }
  } catch (error) {
    console.error('❌ Neo4j connection failed:', error);
  } finally {
    if (driver) {
      await closeNeo4j();
    }
  }
  
  return { blob: blobConnected, neo4j: neo4jConnected };
};
