# Netlify Functions - CRM API Backend

This directory contains serverless API functions for the CRM application using Netlify Functions.

## Overview

The API provides RESTful endpoints for managing:
- **Users** (`/api/users`) - User management and authentication
- **Leads** (`/api/leads`) - Lead tracking and management
- **Opportunities** (`/api/opportunities`) - Sales pipeline management
- **Analytics** (`/api/analytics`) - Dashboard metrics and reporting

## Architecture

```
netlify/functions/
├── utils/
│   ├── api-utils.ts     # Common API utilities (CORS, validation, etc.)
│   └── db.ts            # Database connection wrapper
├── users.ts             # User management API
├── leads.ts             # Lead management API
├── opportunities.ts     # Opportunity management API
├── analytics.ts         # Analytics and reporting API
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## API Endpoints

### Users API (`/api/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/{id}` | Get specific user |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |

**Create User Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER" // optional, defaults to "USER"
}
```

### Leads API (`/api/leads`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | Get all leads |
| GET | `/api/leads/{id}` | Get specific lead |
| POST | `/api/leads` | Create new lead |
| PUT | `/api/leads/{id}` | Update lead |
| DELETE | `/api/leads/{id}` | Delete lead |

**Create Lead Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "phone": "+1234567890", // optional
  "company": "ACME Corp", // optional
  "status": "NEW", // optional, defaults to "NEW"
  "assignedTo": "user-id" // optional
}
```

**Valid Lead Statuses:**
- `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `CLOSED_WON`, `CLOSED_LOST`

### Opportunities API (`/api/opportunities`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/opportunities` | Get all opportunities |
| GET | `/api/opportunities?leadId={id}` | Get opportunities for specific lead |
| GET | `/api/opportunities/{id}` | Get specific opportunity |
| POST | `/api/opportunities` | Create new opportunity |
| PUT | `/api/opportunities/{id}` | Update opportunity |
| DELETE | `/api/opportunities/{id}` | Delete opportunity |

**Create Opportunity Body:**
```json
{
  "title": "Software License Deal",
  "amount": 50000.00,
  "stage": "PROSPECT", // optional, defaults to "PROSPECT"
  "leadId": "lead-id", // required
  "assignedTo": "user-id" // optional
}
```

**Valid Opportunity Stages:**
- `PROSPECT`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `CLOSED_WON`, `CLOSED_LOST`

### Analytics API (`/api/analytics`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Get comprehensive dashboard analytics |

**Analytics Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalLeads": 100,
      "totalOpportunities": 45,
      "totalUsers": 10,
      "totalRevenue": 250000.00,
      "conversionRate": 45.00,
      "winRate": 30.00,
      "averageDealSize": 5555.56
    },
    "leadsByStatus": [...],
    "opportunitiesByStage": [...],
    "userPerformance": [...],
    "trends": {...}
  }
}
```

## Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error description",
  "message": "Optional additional context"
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `404` - Not Found
- `405` - Method Not Allowed
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## CORS Configuration

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`

## Environment Variables

Required environment variables in Netlify:

```bash
DATABASE_URL=postgresql://username:password@host:port/database
# JWT_SECRET=your-jwt-secret-key (for future authentication)
```

## Database Integration

The functions use the existing Prisma setup from `src/lib/db.ts` which provides:
- Connection pooling
- Type-safe database operations
- Built-in CRUD operations for all models
- Analytics aggregation functions

## Error Handling

The API includes comprehensive error handling for:
- Database connection failures
- Validation errors
- Foreign key constraint violations
- Duplicate record conflicts
- Missing resources

## Security Features

- CORS protection
- Request validation
- SQL injection prevention (via Prisma)
- Input sanitization
- Authentication hooks (ready for JWT implementation)

## Development

To test the functions locally:

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Run: `netlify dev`
3. Functions will be available at `http://localhost:8888/.netlify/functions/`

## Deployment

Functions are automatically deployed when you push to your connected Netlify site. The build process:

1. TypeScript compilation (using `netlify/functions/tsconfig.json`)
2. Dependency bundling with esbuild
3. Serverless function packaging

## Testing

Example API calls using curl:

```bash
# Get all users
curl https://your-site.netlify.app/.netlify/functions/users

# Create a new lead
curl -X POST https://your-site.netlify.app/.netlify/functions/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Get analytics
curl https://your-site.netlify.app/.netlify/functions/analytics
```

## Performance Considerations

- Functions have a 10-second execution limit
- Database connections are pooled for efficiency
- Responses are optimized for minimal payload size
- Caching headers can be added for static analytics data

## Future Enhancements

- JWT authentication implementation
- Rate limiting
- Request/response caching
- Real-time notifications via WebSockets
- Advanced analytics with time-series data
- API versioning
- OpenAPI/Swagger documentation