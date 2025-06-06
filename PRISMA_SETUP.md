# Prisma ORM Setup for CRM Application

This document outlines the Prisma ORM integration setup for the React/TypeScript CRM application.

## 📋 What Has Been Set Up

### 1. Dependencies Added
- `@prisma/client` - Prisma client for database operations
- `prisma` - Prisma CLI tools (dev dependency)

### 2. Environment Configuration
- `.env` file created with Prisma Accelerate connection string
- DATABASE_URL configured for edge runtime compatibility

### 3. Prisma Schema
Located at [`prisma/schema.prisma`](prisma/schema.prisma:1) with:

#### Models Created:
- **User** - User management with roles and timestamps
- **Lead** - Lead tracking with contact information and status
- **Opportunity** - Sales opportunities linked to leads

#### Key Features:
- Configured for PostgreSQL with Prisma Accelerate
- Proper relationships between models
- Unique constraints and cascading deletes
- CUID-based IDs for better performance

### 4. Database Utilities
Created [`src/lib/db.ts`](src/lib/db.ts:1) with:
- Prisma client initialization
- Database connection utilities
- Pre-built query functions for all models
- Analytics and aggregation functions
- TypeScript type exports

### 5. NPM Scripts Added
```json
{
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:pull": "prisma db pull", 
  "db:studio": "prisma studio",
  "db:migrate": "prisma migrate dev",
  "db:deploy": "prisma migrate deploy",
  "db:reset": "prisma migrate reset"
}
```

## 🚀 Next Steps (Manual Installation Required)

Due to network/permission issues during setup, you'll need to manually install the packages:

### 1. Install Dependencies
```bash
npm install @prisma/client prisma
```

### 2. Generate Prisma Client
```bash
npm run db:generate
```

### 3. Push Schema to Database
```bash
npm run db:push
```

### 4. Verify Setup
```bash
npm run db:studio
```

## 🔧 Usage Examples

### Import and Use Database Functions
```typescript
import { db, testConnection } from '@/lib/db';

// Test connection
await testConnection();

// Create a user
const user = await db.user.create({
  email: 'john@example.com',
  name: 'John Doe',
  role: 'ADMIN'
});

// Get all leads with relationships
const leads = await db.lead.findMany();

// Create an opportunity
const opportunity = await db.opportunity.create({
  title: 'Enterprise Deal',
  amount: 50000,
  leadId: 'lead-id',
  stage: 'PROPOSAL'
});

// Get analytics
const stats = await db.analytics.getLeadsByStatus();
```

## 📊 Database Schema Overview

### User Model
- `id` (String, Primary Key)
- `email` (String, Unique)
- `name` (String)
- `role` (String, Default: "USER")
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Lead Model  
- `id` (String, Primary Key)
- `name` (String)
- `email` (String, Unique)
- `phone` (String, Optional)
- `company` (String, Optional)
- `status` (String, Default: "NEW")
- `assignedTo` (String, Optional, Foreign Key)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Opportunity Model
- `id` (String, Primary Key)
- `title` (String)
- `amount` (Decimal)
- `stage` (String, Default: "PROSPECT")
- `leadId` (String, Foreign Key)
- `assignedTo` (String, Optional, Foreign Key)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## 🛡️ Security & Best Practices

1. **Environment Variables**: Database URL is stored in `.env` file
2. **Connection Pooling**: Configured for Prisma Accelerate
3. **Edge Runtime**: Compatible with serverless deployments
4. **Type Safety**: Full TypeScript support with generated types
5. **Logging**: Development query logging enabled

## 🔗 VS Code Extensions Recommended

Install these extensions for better Prisma development experience:

1. **[Prisma](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma)** - Syntax highlighting and formatting
   ```
   ext install Prisma.prisma
   ```

2. **[Database Client SQLTOOLS](https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools)** - Database management
   ```
   ext install mtxr.sqltools
   ```

3. **[PostgreSQL Support](https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools-driver-pg)** - PostgreSQL driver
   ```
   ext install mtxr.sqltools-driver-pg
   ```

## 📝 Notes

- The setup is configured for Prisma Accelerate with edge runtime compatibility
- All models include proper relationships and constraints
- Database utilities provide both low-level and high-level query functions
- Analytics functions are included for dashboard reporting
- Temporary TypeScript declarations are in place until packages are installed