# Netlify Blob Integration Documentation

## Overview

This project implements a complete CRM system using Netlify Blob storage as the backend database. The integration provides a serverless, scalable solution for managing leads, opportunities, staff, and users through RESTful API endpoints deployed as Netlify Functions.

### Architecture

- **Frontend**: React with TypeScript and Vite
- **Backend**: Netlify Functions with TypeScript
- **Storage**: Netlify Blob storage for data persistence
- **Authentication**: Bearer token-based authentication
- **API**: RESTful endpoints with comprehensive CRUD operations

### Key Features

- ✅ Full CRUD operations for all entities
- ✅ Data validation and error handling
- ✅ CORS support for cross-origin requests
- ✅ Structured JSON data storage
- ✅ Unique ID generation using crypto.randomUUID()
- ✅ Email validation and duplicate checking
- ✅ Comprehensive logging and debugging

## API Endpoints

### Base URL Structure
```
Production: https://your-site.netlify.app/.netlify/functions/
Development: http://localhost:8888/.netlify/functions/
API Prefix: /api/ (redirects to /.netlify/functions/)
```

## 1. Users API (`/api/users`)

### Data Structure
```typescript
interface User {
  id: string;              // UUID
  email: string;           // Required, unique, validated format
  name: string;            // Required
  role: string;            // Default: 'USER'
  createdAt: string;       // ISO timestamp
  updatedAt?: string;      // ISO timestamp (on updates)
}
```

### Endpoints

#### GET `/api/users` - List All Users
**Description**: Retrieve all users from the system.

**Request**:
```http
GET /api/users
Authorization: Bearer your-token-here
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "role": "ADMIN",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### GET `/api/users/{id}` - Get Specific User
**Description**: Retrieve a specific user by ID.

**Request**:
```http
GET /api/users/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer your-token-here
```

#### POST `/api/users` - Create New User
**Description**: Create a new user in the system.

**Request**:
```http
POST /api/users
Authorization: Bearer your-token-here
Content-Type: application/json

{
  "email": "jane.smith@example.com",
  "name": "Jane Smith",
  "role": "USER"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "email": "jane.smith@example.com",
    "name": "Jane Smith",
    "role": "USER",
    "createdAt": "2024-01-15T11:00:00Z"
  },
  "message": "User created successfully"
}
```

#### PUT `/api/users/{id}` - Update User
**Description**: Update an existing user's information.

**Request**:
```http
PUT /api/users/456e7890-e89b-12d3-a456-426614174001
Authorization: Bearer your-token-here
Content-Type: application/json

{
  "name": "Jane Smith-Johnson",
  "role": "ADMIN"
}
```

#### DELETE `/api/users/{id}` - Delete User
**Description**: Remove a user from the system.

**Request**:
```http
DELETE /api/users/456e7890-e89b-12d3-a456-426614174001
Authorization: Bearer your-token-here
```

## 2. Leads API (`/api/leads`)

### Data Structure
```typescript
interface Lead {
  id: string;              // UUID
  name: string;            // Required
  email: string;           // Required, validated format
  phone?: string | null;   // Optional
  company?: string | null; // Optional
  status: string;          // Default: 'NEW'
  assignedTo?: string | null; // User ID reference
  createdAt: string;       // ISO timestamp
  updatedAt?: string;      // ISO timestamp (on updates)
}
```

### Endpoints

#### GET `/api/leads` - List All Leads
```http
GET /api/leads
Authorization: Bearer your-token-here
```

#### GET `/api/leads/{id}` - Get Specific Lead
```http
GET /api/leads/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer your-token-here
```

#### POST `/api/leads` - Create New Lead
```http
POST /api/leads
Authorization: Bearer your-token-here
Content-Type: application/json

{
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+1-555-0123",
  "company": "Acme Corporation",
  "status": "QUALIFIED",
  "assignedTo": "456e7890-e89b-12d3-a456-426614174001"
}
```

#### PUT `/api/leads/{id}` - Update Lead
```http
PUT /api/leads/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer your-token-here
Content-Type: application/json

{
  "status": "CONVERTED",
  "assignedTo": "789e0123-e89b-12d3-a456-426614174002"
}
```

#### DELETE `/api/leads/{id}` - Delete Lead
```http
DELETE /api/leads/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer your-token-here
```

## 3. Opportunities API (`/api/opportunities`)

### Data Structure
```typescript
interface Opportunity {
  id: string;              // UUID
  title: string;           // Required
  amount: number;          // Required, positive number
  stage: string;           // Default: 'PROSPECT'
  leadId: string;          // Required, reference to Lead
  assignedTo?: string | null; // User ID reference
  createdAt: string;       // ISO timestamp
  updatedAt?: string;      // ISO timestamp (on updates)
}
```

### Valid Stages
- `PROSPECT`
- `QUALIFIED` 
- `PROPOSAL`
- `NEGOTIATION`
- `CLOSED_WON`
- `CLOSED_LOST`

### Endpoints

#### GET `/api/opportunities` - List All Opportunities
```http
GET /api/opportunities
Authorization: Bearer your-token-here
```

#### GET `/api/opportunities?leadId={leadId}` - Filter by Lead
```http
GET /api/opportunities?leadId=123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer your-token-here
```

#### POST `/api/opportunities` - Create New Opportunity
```http
POST /api/opportunities
Authorization: Bearer your-token-here
Content-Type: application/json

{
  "title": "Website Redesign Project",
  "amount": 25000.00,
  "stage": "PROPOSAL",
  "leadId": "123e4567-e89b-12d3-a456-426614174000",
  "assignedTo": "456e7890-e89b-12d3-a456-426614174001"
}
```

## 4. Staff API (`/api/staff`)

### Data Structure
```typescript
interface Staff {
  id: string;              // UUID
  email: string;           // Required, unique, validated format
  name: string;            // Required
  role: string;            // Required
  department?: string | null; // Optional
  phone?: string | null;   // Optional
  status: string;          // Default: 'ACTIVE'
  createdAt: string;       // ISO timestamp
  updatedAt?: string;      // ISO timestamp (on updates)
}
```

### Endpoints

#### GET `/api/staff` - List All Staff
```http
GET /api/staff
Authorization: Bearer your-token-here
```

#### POST `/api/staff` - Create New Staff Member
```http
POST /api/staff
Authorization: Bearer your-token-here
Content-Type: application/json

{
  "email": "alice.johnson@company.com",
  "name": "Alice Johnson",
  "role": "Sales Manager",
  "department": "Sales",
  "phone": "+1-555-0156",
  "status": "ACTIVE"
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error description",
  "message": "Additional context (optional)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors, missing fields)
- `401` - Unauthorized (missing/invalid authentication)
- `404` - Not Found (resource doesn't exist)
- `405` - Method Not Allowed
- `409` - Conflict (duplicate email, etc.)
- `500` - Internal Server Error

### Validation Errors

#### Missing Required Fields
```json
{
  "success": false,
  "error": "Missing required fields: email, name"
}
```

#### Email Format Validation
```json
{
  "success": false,
  "error": "Invalid email format"
}
```

#### Duplicate Email
```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

#### Invalid Amount (Opportunities)
```json
{
  "success": false,
  "error": "Amount must be a positive number"
}
```

#### Invalid Stage (Opportunities)
```json
{
  "success": false,
  "error": "Invalid stage. Must be one of: PROSPECT, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST"
}
```

## Usage Examples

### JavaScript/TypeScript Frontend Integration

```typescript
// API client configuration
const API_BASE_URL = '/.netlify/functions';
const AUTH_TOKEN = 'your-bearer-token';

const apiClient = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
};

// Fetch all users
async function getUsers() {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'GET',
    headers: apiClient.headers
  });
  return response.json();
}

// Create a new lead
async function createLead(leadData) {
  const response = await fetch(`${API_BASE_URL}/leads`, {
    method: 'POST',
    headers: apiClient.headers,
    body: JSON.stringify(leadData)
  });
  return response.json();
}

// Update an opportunity
async function updateOpportunity(id, updateData) {
  const response = await fetch(`${API_BASE_URL}/opportunities/${id}`, {
    method: 'PUT',
    headers: apiClient.headers,
    body: JSON.stringify(updateData)
  });
  return response.json();
}

// Delete a staff member
async function deleteStaff(id) {
  const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
    method: 'DELETE',
    headers: apiClient.headers
  });
  return response.json();
}
```

### React Hook Example
```typescript
import { useState, useEffect } from 'react';

function useLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const response = await fetch('/.netlify/functions/leads', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const result = await response.json();
        
        if (result.success) {
          setLeads(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to fetch leads');
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, []);

  return { leads, loading, error };
}
```

## Deployment Instructions

### Prerequisites
- Node.js 18+ installed
- Netlify CLI installed (`npm install -g netlify-cli`)
- Netlify account and site configured

### Environment Setup

1. **Install Dependencies**:
```bash
npm install
```

2. **Build Functions**:
```bash
npm run build:functions
```

3. **Local Development**:
```bash
# Start Netlify dev server
netlify dev

# Or use separate commands
npm run dev  # Frontend (port 5173)
netlify functions:serve  # Functions (port 8888)
```

### Production Deployment

1. **Build Project**:
```bash
npm run build
```

2. **Deploy to Netlify**:
```bash
netlify deploy --prod
```

3. **Environment Variables**:
Set these in your Netlify dashboard under Site Settings > Environment Variables:
- `NODE_VERSION=18` (already configured in netlify.toml)
- Any authentication secrets (JWT_SECRET, etc.)

### Netlify Configuration

The [`netlify.toml`](netlify.toml:1) file is pre-configured with:
- ✅ Function TypeScript support with esbuild bundler
- ✅ API route redirects (`/api/*` → `/.netlify/functions/*`)
- ✅ SPA routing support for React
- ✅ Node.js 18 runtime
- ✅ Source map inclusion for debugging

## Troubleshooting

### Common Issues

#### 1. Functions Not Building
**Problem**: TypeScript compilation errors
**Solution**: 
```bash
# Check TypeScript configuration
npx tsc --noEmit
# Rebuild functions
npm run build:functions
```

#### 2. CORS Errors
**Problem**: Cross-origin requests blocked
**Solution**: Verify CORS headers are properly set in [`api-utils.ts`](netlify/functions/utils/api-utils.ts:31)

#### 3. Authentication Failures
**Problem**: 401 Unauthorized responses
**Solution**: 
- Verify Bearer token is included in request headers
- Check token format: `Authorization: Bearer your-token`
- Review authentication logic in [`api-utils.ts`](netlify/functions/utils/api-utils.ts:125)

#### 4. Blob Storage Errors
**Problem**: Data not persisting or retrieval failures
**Solution**:
- Verify `@netlify/blobs` package is installed
- Check Netlify site has Blob storage enabled
- Review error logs in Netlify Functions dashboard

#### 5. Validation Errors
**Problem**: Required field or format validation failures
**Solution**:
- Review API documentation for required fields
- Verify email format follows standard RFC pattern
- Check numeric values are positive (for amounts)

### Debug Mode

Enable detailed logging by checking the Netlify Functions logs:
1. Go to Netlify dashboard
2. Navigate to Functions section
3. View real-time logs for debugging

### Performance Optimization

1. **Cold Start Reduction**: Functions are bundled with esbuild for faster startup
2. **Blob Storage Efficiency**: Each entity uses separate stores for isolation
3. **Memory Management**: JSON parsing is optimized with error handling

## API Testing

Use the provided test file [`test-endpoints.http`](netlify/functions/test-endpoints.http:1) with REST Client extension or tools like Postman for comprehensive API testing.

## Security Considerations

1. **Authentication**: Currently uses placeholder authentication - implement proper JWT verification for production
2. **Input Validation**: All inputs are validated for format and required fields
3. **CORS Policy**: Configured for development - restrict origins for production
4. **Rate Limiting**: Basic structure in place - implement proper rate limiting for production
5. **Data Sanitization**: JSON data is parsed safely with error handling

## Monitoring and Analytics

- Function execution logs available in Netlify dashboard
- Request/response logging implemented in all endpoints
- Error tracking with detailed console output
- Performance metrics available through Netlify analytics

---

**Next Steps for Production:**
1. Implement proper JWT authentication
2. Add comprehensive rate limiting
3. Set up monitoring and alerting
4. Configure backup strategies
5. Implement data migration tools
6. Add comprehensive test coverage