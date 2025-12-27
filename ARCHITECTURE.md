# AI Medical Assistant - Architecture Documentation

## System Overview

The AI Medical Assistant is a full-stack web application built using modern web technologies with a serverless backend architecture. The system leverages AI capabilities for intelligent medical assistance while maintaining strict data privacy and security standards.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  React UI  │  │  React     │  │  State     │            │
│  │ Components │  │  Router    │  │ Management │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway Layer                          │
│           Supabase Client (REST & Realtime)                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend Services (Lovable Cloud)            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Edge      │  │ PostgreSQL │  │  Storage   │            │
│  │ Functions  │  │  Database  │  │  Buckets   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Lovable   │  │ Firecrawl  │  │ ScraperAPI │            │
│  │  AI Gateway│  │    API     │  │            │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Architecture

#### Layer 1: Presentation Layer
- **Components**: Reusable UI components built with React
- **Pages**: Route-specific page components
- **Layouts**: Shared layout components with navigation

#### Layer 2: State Management
- **React Query**: Server state caching and synchronization
- **React Context**: Global state for authentication and theme
- **Local State**: Component-level state with useState/useReducer

#### Layer 3: Data Access
- **Supabase Client**: Direct database access via REST API
- **Custom Hooks**: Abstracted data fetching logic
- **Real-time Subscriptions**: Live data updates

#### Layer 4: Utilities
- **Form Validation**: Zod schemas with React Hook Form
- **Type Safety**: TypeScript throughout
- **Styling**: Tailwind CSS with design tokens

### Backend Architecture

#### Edge Functions (Serverless)

**Function: chat**
- Purpose: Stream AI responses for medical queries
- Trigger: HTTP POST request
- Dependencies: Lovable AI Gateway
- Features:
  - System prompt injection
  - Conversation history management
  - Token-by-token streaming
  - Error handling with user-friendly messages

**Function: scrape-hospital**
- Purpose: Scrape hospital websites using external APIs
- Trigger: HTTP POST request
- Dependencies: Firecrawl API, ScraperAPI
- Features:
  - Multi-method scraping (Firecrawl, ScraperAPI, Native)
  - Automatic fallback mechanism
  - Content extraction and classification
  - Statistics logging

**Function: advanced-scrape**
- Purpose: Advanced native web scraping with deep crawling
- Trigger: HTTP POST request
- Dependencies: Deno DOM parser
- Features:
  - Recursive URL discovery (max 100 pages, 3 levels)
  - Intelligent content extraction
  - Metadata extraction (emails, phones, structured data)
  - Page type classification
  - Contact information detection

**Function: private-ai-chat**
- Purpose: User-specific AI conversations
- Trigger: HTTP POST request
- Dependencies: Lovable AI Gateway
- Features:
  - User context inclusion
  - Private conversation history
  - Personalized responses

**Function: send-appointment-reminder**
- Purpose: Automated appointment reminders
- Trigger: Scheduled (cron) or manual
- Dependencies: Resend API
- Features:
  - Email composition
  - Template rendering
  - Delivery tracking

**Function: hospital-assistant**
- Purpose: Hospital-specific AI assistant
- Trigger: HTTP POST request
- Dependencies: Lovable AI Gateway, Hospital database
- Features:
  - Context-aware responses using scraped hospital data
  - Service information retrieval
  - Location-based assistance

#### Database Architecture

**Access Patterns**:
1. Direct client access (via Supabase client)
2. Edge function access (via service role)
3. Real-time subscriptions (via Supabase Realtime)

**Security Model**:
- Row Level Security (RLS) on all user tables
- Service role for admin operations
- JWT authentication for user verification

**Optimization**:
- Indexes on frequently queried columns
- Database functions for complex queries
- Materialized views for reporting (future)

## Data Flow

### Authentication Flow

```
User Login Request
    ↓
Supabase Auth
    ↓
JWT Token Generation
    ↓
Client Storage (localStorage)
    ↓
Subsequent Requests Include Token
    ↓
RLS Verification
    ↓
Data Access Granted/Denied
```

### AI Chat Flow

```
User Message
    ↓
Frontend (useStreamingChat hook)
    ↓
Edge Function (/functions/v1/chat)
    ↓
System Prompt Addition
    ↓
Lovable AI Gateway
    ↓
AI Model Processing
    ↓
Streaming Response (SSE)
    ↓
Token-by-Token Rendering
    ↓
Complete Message Display
```

### Hospital Scraping Flow

```
User Initiates Scrape
    ↓
Frontend (Hospitals page)
    ↓
Edge Function Selection:
    - Advanced Native (no API key)
    - Firecrawl (if API key configured)
    - ScraperAPI (if API key configured)
    ↓
Web Scraping Process:
    - URL fetching
    - HTML parsing
    - Content extraction
    - Link discovery (native only)
    - Recursive crawling (native only)
    ↓
Data Processing:
    - Title extraction
    - Page type classification
    - Metadata extraction
    - Content cleaning
    ↓
Database Storage:
    - Delete old pages
    - Insert new pages
    - Update hospital metadata
    - Log statistics
    ↓
Success Response
    ↓
UI Update
```

## Security Architecture

### Authentication & Authorization

**Authentication Layers**:
1. **Supabase Auth**: Email/password authentication
2. **JWT Tokens**: Stateless session management
3. **Refresh Tokens**: Long-lived authentication

**Authorization Layers**:
1. **Row Level Security**: Database-level access control
2. **Edge Function Guards**: Function-level authorization
3. **Client-Side Guards**: Route protection

### Data Protection

**Encryption**:
- Data in transit: HTTPS/TLS 1.3
- Data at rest: PostgreSQL encryption
- Secrets: Supabase Vault encryption

**Access Control**:
- User-scoped data isolation
- Role-based access (future)
- API key rotation (manual)

**Audit Trail**:
- Database audit logs
- Edge function logs
- Authentication events

## Scalability Considerations

### Frontend Scalability
- **CDN Distribution**: Static assets via CDN
- **Code Splitting**: Route-based lazy loading
- **Bundle Optimization**: Tree shaking and minification
- **Image Optimization**: Lazy loading and modern formats

### Backend Scalability
- **Serverless Functions**: Auto-scaling edge functions
- **Connection Pooling**: PostgreSQL connection management
- **Caching**: React Query for client-side caching
- **Rate Limiting**: Lovable AI Gateway rate limits

### Database Scalability
- **Read Replicas**: For read-heavy workloads (future)
- **Sharding**: For large datasets (future)
- **Archiving**: Old data archival strategy (future)
- **Indexes**: Optimized query performance

## Performance Optimization

### Frontend Performance
- **Initial Load**: < 2s on 3G connection
- **Time to Interactive**: < 3s
- **First Contentful Paint**: < 1s
- **Bundle Size**: < 500KB gzipped

**Techniques**:
- Route-based code splitting
- Dynamic imports for heavy components
- Image lazy loading
- Virtual scrolling for long lists

### Backend Performance
- **Edge Function Cold Start**: < 500ms
- **Database Query Time**: < 100ms average
- **AI Response Time**: 2-5s (streaming)
- **Scraping Time**: 30-120s depending on method

**Techniques**:
- Edge function warming (future)
- Query optimization
- Streaming responses
- Background jobs for long tasks

## Monitoring & Observability

### Logging
- **Frontend**: Console logs (development)
- **Edge Functions**: Supabase logs
- **Database**: Query logs and slow query logs

### Metrics (Future)
- User engagement metrics
- AI response quality metrics
- System performance metrics
- Error rates and types

### Alerting (Future)
- Critical error alerts
- Performance degradation alerts
- Security event alerts

## Disaster Recovery

### Backup Strategy
- **Database**: Automatic daily backups (Supabase)
- **Storage**: Redundant storage (Supabase)
- **Code**: Git version control

### Recovery Procedures
- **Database Restore**: Point-in-time recovery
- **Version Rollback**: Git revert/rollback
- **Data Export**: Manual export capabilities

## Future Architecture Enhancements

### Short-term
- [ ] Implement caching layer (Redis)
- [ ] Add rate limiting middleware
- [ ] Implement real-time notifications
- [ ] Add analytics dashboard

### Medium-term
- [ ] Migrate to microservices (if needed)
- [ ] Implement event sourcing
- [ ] Add CDC for data pipeline
- [ ] Implement CQRS pattern

### Long-term
- [ ] Multi-region deployment
- [ ] Advanced ML models for diagnostics
- [ ] Blockchain for medical records (exploration)
- [ ] IoT device integration

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | React 18 | UI rendering and state management |
| Build Tool | Vite | Fast development and optimized builds |
| Styling | Tailwind CSS | Utility-first CSS framework |
| UI Components | shadcn/ui | Accessible component library |
| Backend Platform | Lovable Cloud | Serverless backend infrastructure |
| Database | PostgreSQL | Relational data storage |
| Authentication | Supabase Auth | User authentication and authorization |
| Storage | Supabase Storage | File storage with CDN |
| Edge Functions | Deno Runtime | Serverless function execution |
| AI Gateway | Lovable AI | AI model access and management |
| Web Scraping | Firecrawl/ScraperAPI | Website content extraction |
| Type Safety | TypeScript | Static type checking |
| Form Handling | React Hook Form + Zod | Form validation and management |
| State Management | React Query | Server state caching |
| Testing | Vitest + Playwright | Unit and E2E testing |

## Deployment Architecture

```
GitHub Repository
    ↓
Lovable Build System
    ↓
┌─────────────┬──────────────┐
│   Frontend  │   Backend    │
│   (Static)  │ (Serverless) │
└─────────────┴──────────────┘
    ↓               ↓
  CDN          Edge Locations
    ↓               ↓
  Users         Users
```

### Deployment Process

1. **Code Push**: Developer pushes to GitHub
2. **Auto Deployment**: Lovable detects changes
3. **Backend Deploy**: Edge functions deploy immediately
4. **Frontend Build**: Static assets built and optimized
5. **Frontend Deploy**: Requires manual "Update" click
6. **CDN Distribution**: Assets distributed globally
7. **Live**: Changes visible to users

### Environment Management

- **Development**: Local development server
- **Staging**: Lovable preview environment
- **Production**: Custom domain or lovable.app subdomain

---

This architecture document is a living document and should be updated as the system evolves.

