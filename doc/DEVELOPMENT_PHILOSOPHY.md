# PosalPro MVP2 - Development Philosophy

> **Horo5**: Treat principles (clarity, root-cause fixes, sensible data boundaries)
> as portable. Stack-specific items (Prisma, tenant middleware, `useApiClient`)
> apply only where that code exists—see **[`../AGENTS.md`](../AGENTS.md)**.

## Fundamental Principles for Code Review & Future Development

**Version**: 1.1.0 | **Date**: January 1, 2026 | **Last Updated**: ORM over raw SQL
principle added (5.4); Principle 1.3 proposal wizard / draft persistence
cross-reference **Sources**:
CORE_REQUIREMENTS.md, LESSONS_LEARNED.md, LESSONS_LEARNED_NOV1_2025.md,
BUG_FIXING_PHILOSOPHY.md **Purpose**: Single source of truth for architectural
decisions and problem-solving approaches. **Implementation checklists and
commands**: [`docs/CORE_REQUIREMENTS.md` → **Start here**](CORE_REQUIREMENTS.md#start-here).

---

## Table of Contents

1. [Core Architecture](#1-core-architecture)
2. [Code Quality](#2-code-quality)
3. [Performance First](#3-performance-first)
4. [Error Handling](#4-error-handling)
5. [Data Management](#5-data-management)
6. [Security](#6-security)
7. [Developer Experience](#7-developer-experience)
8. [Multi-Tenancy](#8-multi-tenancy)
9. [Observability & API Contracts](#9-observability--api-contracts)

---

## 1. Core Architecture

### Principle 1.1: Thin Routes, Rich Services

**Philosophy**: API routes delegate all logic to service layers.

#### Implementation

- **API Routes**: Validation, auth checks, and delegation only
- **Services**: All business logic, database access, complex operations
- **No Prisma in routes**: Always use database services

```typescript
// ✅ Route delegates to service and returns raw JSON payload
export const GET = createRoute(
  { permissions: ['products:read'], query: ProductQuerySchema },
  async ({ query }) => json(await productService.getProducts(query))
);

// ❌ Direct database access in route
export const GET = async () => ok(await prisma.product.findMany());
```

> **API response policy (2025-11)**
>
> - New/updated routes **must** return raw payloads via `json()` / `jsonError()`
>   from `src/lib/api/response.ts`.
> - Legacy helpers `ok()` / `error()` are deprecated and will be removed after
>   Q1 2026 once all callers are migrated.
> - To see remaining legacy responses run: `rg "ok(" src/app/api -g"*.ts"`.
>   Update any touched routes while you are there.

---

### Principle 1.2: useApiClient Pattern (Mandatory)

**Philosophy**: Standardized data fetching prevents custom caching complexity.

#### Implementation

- **Always use** `useApiClient()` - never direct `fetch()`
- **Built-in caching** - React Query handles everything
- **No custom cache layers** - They cause 90% of data fetching bugs

```typescript
// ✅ CORRECT: Simple, proven, fast
export function useProducts(params: ProductQuery) {
  const apiClient = useApiClient();
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => apiClient.get<ProductList>('/api/products', { params }),
    staleTime: 30000,
    gcTime: 120000,
  });
}

// ❌ WRONG: Custom caching
const cache = new Map();
if (cache.has(key)) return cache.get(key);
```

**Result**: Lesson #12 achieved 90% code reduction, instant loading by following
this pattern.

---

### Principle 1.3: State Management Separation

**Philosophy**: Clear boundaries prevent state management bugs.

#### Zustand: UI State Only

- Filters, selections, modal state
- Never store server data

#### React Query: Server State Only

- Data fetching, caching, mutations
- Automatic cache invalidation

**Multi-step wizards** (e.g. proposal creation): Zustand holds ephemeral **wizard
UI state** (per-step `stepData` in `src/lib/store/proposalStore.ts`); React Query
owns **server-backed** proposal records and mutations. Versioned **local draft**
recovery, when enabled, lives outside the Zustand store—see
`docs/CORE_REQUIREMENTS.md` (Data Persistence Optimization and Data Integrity)
and `src/components/proposals/wizard/persistence.ts`.

```typescript
// ✅ Zustand for UI state
const useProductUI = create(set => ({
  filters: { search: '' },
  setFilters: f => set({ filters: f }),
}));

// ✅ React Query for server state
const useProducts = params =>
  useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getProducts(params),
  });
```

---

### Principle 1.4: Feature-Based Organization

**Philosophy**: Organize by domain, not technical layer.

```
src/features/[domain]/
├── schemas.ts        # Zod schemas, types
├── keys.ts          # React Query keys
├── hooks/           # useX pattern
└── index.ts         # Exports
```

---

## 2. Code Quality

### Principle 2.1: The 2-Year Developer Test

**Philosophy**: Code must be understandable by a 2-year experience developer in
5 minutes.

#### Rules

1. **Explicit Over Clever**: Clear intent beats terseness
2. **No Over-Abstraction**: Direct solutions preferred
3. **Max 3-Level Nesting**: Use early returns
4. **One Responsibility**: Each function does one thing
5. **Named Constants**: No magic numbers/strings
6. **Self-Documenting Names**: Function names explain purpose

```typescript
// ✅ Clear and simple
function calculateDiscount(price: number, discountPercent: number): number {
  return price * (discountPercent / 100);
}

// ❌ Clever but confusing
const calcDisc = (p: number, d: number) => p * (d / 100);
```

---

### Principle 2.2: TypeScript Zero Tolerance

**Philosophy**: TypeScript errors are build failures.

```bash
npm run type-check  # Must return 0 errors before commit
```

- No `any` types (except documented exceptions)
- Align types with Prisma schema exactly
- Use Zod for runtime validation
- Export types from feature modules

---

### Principle 2.3: Prisma Schema is Source of Truth

**Philosophy**: All data structures align with Prisma schema.

```typescript
// 1. Check Prisma schema
grep -A 50 "model Product" prisma/schema.prisma

// 2. Align Zod schemas
const ProductSchema = z.object({
  value: z.number()  // Matches Prisma field name exactly
});

// 3. Validate
npm run type-check
```

---

## 3. Performance First

### Principle 3.1: Optimization Hierarchy

**Philosophy**: Optimize in order of impact.

```
1. DATABASE (70% gains)
   ↓ Indexes, transactions, query optimization

2. API EFFICIENCY (20% gains)
   ↓ Reduce round-trips, strategic caching

3. FRONTEND (8% gains)
   ↓ Lazy loading, code splitting

4. ARCHITECTURE (2% gains, HIGH RISK)
   ↓ Last resort only
```

**Proven Results**:

- Admin Metrics: 70% faster (6 queries → 1 aggregation)
- Customer Query: 99.5% faster (83ms → 0.39ms with indexes)
- Product List: 4x faster (parallel loading)

---

### Principle 3.2: Database Performance Patterns

#### Pattern: Parallel Loading

```typescript
// ✅ All queries fire simultaneously (4x faster)
const [proposals, customers, products] = React.useMemo(
  () => [useProposals(), useCustomers(), useProducts()],
  []
);

// ❌ Sequential waterfall
const proposals = await fetch(); // 500ms
const customers = await fetch(); // 500ms
// Total: 1500ms vs 500ms
```

#### Pattern: SQL Aggregation

```typescript
// ✅ Single query (70% faster)
SELECT json_build_object(
  'totalUsers', (SELECT COUNT(*) FROM users),
  'activeUsers', (SELECT COUNT(*) FROM users WHERE status = 'ACTIVE')
) as metrics

// ❌ Multiple queries
const totalUsers = await prisma.user.count();
const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' }});
```

#### Pattern: Composite Indexes

```prisma
model Customer {
  @@index([tenantId, status, name])
  @@index([tenantId, createdAt(sort: Desc)])
}
```

---

### Principle 3.3: Caching Strategy

**Philosophy**: Multi-layer with clear TTLs.

| Layer       | TTL  | Use Case            |
| ----------- | ---- | ------------------- |
| React Query | 30s  | Client cache        |
| Redis       | 5min | Shared server cache |
| Database    | -    | Source of truth     |

```typescript
// Cache TTL Guidelines
Auth & Sessions:    180-300s   (security-focused)
User Permissions:   300s       (balance security/perf)
Product Catalog:    1800s      (relatively static)
Search Results:     60s        (frequently changing)
```

---

### Principle 3.4: Optimistic Updates

**Philosophy**: Update UI instantly, invalidate strategically.

```typescript
// ✅ Instant UI + targeted invalidation (75% API reduction)
onSuccess: (updated, variables) => {
  queryClient.setQueryData(keys.byId(variables.id), updated);
  queryClient.invalidateQueries({ queryKey: keys.lists(), exact: true });
};

// ❌ Extra API call
const updated = await update(id, data);
const fresh = await get(id); // Unnecessary!
```

---

### Principle 3.5: Analytics Discipline

**Philosophy**: Batched, throttled, emergency-disable.

```typescript
// ✅ Optimized analytics (batching, 300ms throttle)
const analytics = useOptimizedAnalytics();
analytics.trackOptimized(
  'event',
  { meta },
  {
    userStory: 'US-X.X',
    hypothesis: 'HX',
  }
);

// ❌ Direct tracking (rebuild spam, performance degradation)
console.log('analytics:', data); // Blocked in production
track('event', data); // Unthrottled
```

**Features**: Batching, emergency disable flag, no hot-path overhead.

### Principle 3.6: Cache Invalidation Graph (React Query)

**Philosophy**: Cache invalidation is centralized and declarative.

- Use `CacheInvalidationService` (src/lib/cache/cacheInvalidationService.ts) in
  every mutation instead of manual `queryClient.invalidateQueries`.
- Entity relationships (dashboard, global search, templates, etc.) live in
  `CACHE_ENTITY_RELATIONSHIPS` (src/lib/cache/cacheInvalidationMap.ts) so one
  mutation automatically cascades to downstream caches.
- `invalidateEntity` handles CRUD-specific behavior (remove vs invalidate vs
  refresh). `invalidateMultiple` batches invalidations; `invalidateWithCascade`
  explicitly fans out to related entities.
- Service is cheap to instantiate—wrap in
  `useMemo(() => new CacheInvalidationService(queryClient), [queryClient])`.

```typescript
const queryClient = useQueryClient();
const cacheInvalidation = useMemo(
  () => new CacheInvalidationService(queryClient),
  [queryClient]
);

return useMutation({
  mutationFn: updateProposal,
  onSuccess: updated => {
    queryClient.setQueryData(proposalKeys.byId(updated.id), updated);
    cacheInvalidation.invalidateMultiple([
      { entity: 'proposal', entityId: updated.id, changeType: 'update' },
      { entity: 'dashboard', changeType: 'refresh' },
    ]);
  },
});
```

**Outcome**: Deterministic cache state, no duplicate refetches, instant UI
updates after mutations.

---

## 4. Error Handling

### Principle 4.1: Trace to Root Cause

**Philosophy**: Fix the root cause, not the symptom.

```
Symptom → Chain of Events → Root Cause
   ↓            ↓              ↓
Visible     Trace         Fix Here
Problem     Backward      (Not symptom!)
```

**Example**:

- ❌ Symptom: Duplicate proposals
- ❌ Surface Fix: Delete duplicates
- ✅ Root Cause: Empty user IDs → validation failure → retry
- ✅ Real Fix: Validate user IDs at entry point

---

### Principle 4.2: Centralized Error Handling

**Philosophy**: One error handling system for entire application.

```typescript
// ✅ REQUIRED: ErrorHandlingService everywhere
try {
  const result = await operation();
  logInfo('Success', { component, operation, requestId });
} catch (error) {
  const processed = errorService.processError(
    error,
    'Operation failed',
    ErrorCodes.DATA.QUERY_FAILED,
    { component, operation, requestId }
  );
  logError('Failed', processed, { errorCode: processed.code });
  throw processed;
}
```

---

### Principle 4.3: Validate at Entry Points

**Philosophy**: Check data quality when it enters your system.

```typescript
// ✅ Entry point validation
async function createProposal(data: ProposalData) {
  const validated = ProposalSchema.parse(data);
  const validMembers = validated.team.filter(
    m => typeof m.userId === 'string' && m.userId.trim().length > 0
  );
  if (validMembers.length === 0) {
    throw badRequest('At least one valid team member required');
  }
  return await proposalService.create({ ...validated, team: validMembers });
}

// ❌ Late validation deep in code
async function saveToDb(proposal) {
  if (!proposal.team[0].userId) throw new Error('Invalid'); // Too late!
}
```

---

### Principle 4.4: Debug Logging Performance

**Philosophy**: Gate debug logs behind environment flags.

```typescript
// ✅ Environment-gated (production-safe)
if (process.env.NEXT_PUBLIC_ENABLE_WIZARD_DEBUG === 'true') {
  logDebug('Step data', { stepData });
}

// ❌ Unconditional (runs in production!)
logDebug('Step data', { stepData });
```

**Impact**: 100% elimination of debug overhead in production.

---

## 5. Data Management

### Principle 5.1: Transaction Patterns

**Philosophy**: Atomic operations for multi-step database changes.

```typescript
// ✅ Atomic transaction
await prisma.$transaction(async tx => {
  const proposal = await tx.proposal.create({ data });
  await tx.proposalSection.createMany({ data: sections });
  return proposal;
});

// ❌ Separate operations (data inconsistency risk)
const proposal = await prisma.proposal.create({ data });
await prisma.proposalSection.createMany({ data: sections }); // Could fail!
```

---

### Principle 5.2: Transaction Preload Pattern

**Philosophy**: Minimize queries within transactions to prevent timeouts.

```typescript
// ✅ Preload collections, validate in-memory
await prisma.$transaction(async tx => {
  const existing = await tx.entity.findMany({ where: { parentId } });
  const idSet = new Set(existing.map(e => e.id));
  const categoryMap = new Map(existing.map(e => [e.key, e.id]));

  // O(1) validation, no database calls
  for (const item of items) {
    if (idSet.has(item.relatedId)) {
      /* valid */
    }
  }

  // Combine updates into single operation
  await tx.parent.update({ where: { id }, data: { ...fields, nested } });
});

// ❌ Query per validation (N database calls, timeout risk)
await prisma.$transaction(async tx => {
  for (const item of items) {
    await tx.entity.findUnique({ where: { id: item.relatedId } }); // N queries!
  }
  await tx.parent.update({ data: fields });
  await tx.parent.update({ data: { nested } }); // Separate calls
});
```

**Impact**: Eliminates 5s+ timeouts; reduces round-trips 50-70%.

---

### Principle 5.3: UPSERT Pattern

**Philosophy**: Prevent unique constraint violations.

```typescript
// ✅ UPSERT (safe)
await tx.entity.upsert({
  where: { parentId_key: { parentId: id, key } },
  update: { value, order },
  create: { parentId: id, key, value, order },
});

// ❌ DELETE + CREATE (fails if exists)
await tx.entity.deleteMany({ where: { parentId: id } });
await tx.entity.create({ data: item });
```

---

### Principle 5.4: Prisma ORM Over Raw SQL (REQUIRED)

**Philosophy**: Always prefer Prisma ORM methods over raw SQL queries (`$queryRaw`, `$executeRaw`).

**Rationale**:
1. **Type Safety**: Prisma provides compile-time type checking
2. **Tenant Middleware Integration**: Raw SQL bypasses tenant isolation middleware
3. **Consistency**: ORM ensures consistent query patterns across codebase
4. **Security**: Prisma handles SQL injection prevention automatically
5. **Maintainability**: Schema changes automatically reflect in ORM queries

```typescript
// ✅ CORRECT: Use Prisma ORM with explicit tenantId
const company = await tx.company.findFirst({
  where: { tenantId },
  select: { id: true, nextProposalNumber: true },
});

await tx.company.updateMany({
  where: { id: company.id, tenantId },
  data: { nextProposalNumber: { increment: 1 } },
});

// ❌ WRONG: Raw SQL (bypasses middleware, loses type safety)
await tx.$queryRaw`UPDATE companies SET "nextProposalNumber" = ...`;
```

**When Raw SQL is Acceptable** (Rare Cases):
- Complex aggregations not expressible in Prisma (use `$queryRaw` with explicit `tenantId`)
- Bulk operations for performance (100k+ rows)
- Database-specific features (window functions, CTEs)

**Always Include**: Explicit `tenantId` in WHERE clause when using raw SQL.

---

### Principle 5.5: Stable Child Collections (Diff Everything)

**Philosophy**: Never drop and recreate child rows (products, sections, contacts, etc.). Stable IDs keep
React Query caches, optimistic UI, and analytics intact.

```typescript
// ✅ Diff strategy: update existing, create new, delete removed
const existing = await tx.proposalSection.findMany({ where: { proposalId } });
const keepIds = new Set(payload.filter(s => s.id).map(s => s.id));

await Promise.all(
  payload
    .filter(section => section.id && keepIds.has(section.id))
    .map(section =>
      tx.proposalSection.update({
        where: { id: section.id! },
        data: pickSectionFields(section),
      })
    )
);

const toCreate = payload.filter(section => !section.id);
if (toCreate.length) {
  await tx.proposalSection.createMany({ data: toCreate.map(section => pickSectionFields(section)) });
}

const idsToDelete = existing.map(section => section.id).filter(id => !keepIds.has(id));
if (idsToDelete.length) {
  await tx.proposalSection.deleteMany({ where: { proposalId, id: { in: idsToDelete } } });
}
```

```typescript
// ❌ Anti-pattern: delete all + recreate
await tx.proposalSection.deleteMany({ where: { proposalId } });
await tx.proposalSection.createMany({ data: payload });
```

**Impact**: Stops auto-save loops, preserves section/product analytics, and prevents accidental loss of
assignments or audit history.

---

### Principle 5.6: localStorage Versioning

**Philosophy**: Version cache with integrity validation.

```typescript
// ✅ Versioned cache
interface CachedData {
  version: string;
  timestamp: number;
  data: State;
}

function loadFromCache(): State | null {
  const cached = JSON.parse(localStorage.getItem(KEY));
  if (cached.version !== CURRENT_VERSION) {
    localStorage.removeItem(KEY);
    return null;
  }
  if (Date.now() - cached.timestamp > TTL) {
    localStorage.removeItem(KEY);
    return null;
  }
  return StateSchema.parse(cached.data);
}

// ❌ No versioning (stale data risk)
const data = JSON.parse(localStorage.getItem(KEY));
```

**Critical Lesson**: Stale cache caused data corruption in production.

---

### Principle 5.7: Cursor Pagination

**Philosophy**: Efficient for large datasets.

```typescript
// ✅ Cursor-based (constant-time performance)
const products = await prisma.product.findMany({
  take: limit + 1,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: 'desc' },
});
const hasMore = products.length > limit;
const nextCursor = hasMore ? products[limit - 1].id : null;

// ❌ Offset-based (degrades with page number)
const products = await prisma.product.findMany({
  skip: page * limit, // Slow on high pages
  take: limit,
});
```

---

## 6. Security

### Principle 6.1: Fail Fast in Production

**Philosophy**: Security violations must halt execution immediately.

```typescript
// ✅ Fail fast (production-safe)
if (!context?.tenantId && process.env.NODE_ENV === 'production') {
  throw new StandardError({
    message: 'Tenant context required',
    code: ErrorCodes.SECURITY.SECURITY_VIOLATION,
  });
}

// ❌ Log and continue (security risk!)
if (!context?.tenantId) {
  logWarn('No tenant context');
  return await fn(); // UNSAFE - cross-tenant data leakage!
}
```

---

### Principle 6.2: Rate Limiting

**Philosophy**: Consolidated Redis-backed rate limiting.

| Endpoint Type   | Limit       | Use Case                 |
| --------------- | ----------- | ------------------------ |
| Session Read    | No limit    | High-frequency read-only |
| General Read    | 200 req/min | Standard queries         |
| Mutation        | 20 req/min  | Create/update/delete     |
| Sensitive Write | 5 req/15min | Login, registration      |

**Key Rule**: High limits for reads, strict for writes.

---

### Principle 6.3: Dynamic Permissions

**Philosophy**: Database-driven permissions, minimal hardcoded roles.

```typescript
// ✅ Dynamic permissions from database
export const GET = createRoute(
  {
    permissions: ['proposals:read'], // Checked from database
  },
  async ({ user }) => {
    // Only 'System Administrator' is hardcoded (admin bypass)
    const isAdmin = user.roles?.includes('System Administrator');

    if (!isAdmin) {
      // Everyone else: database permission check
      const hasPermission = await PermissionService.hasPermission(
        user.id,
        'proposals:read'
      );
      if (!hasPermission) throw forbidden();
    }
  }
);

// ❌ Hardcoded entitlements (deprecated)
export const GET = createRoute({
  entitlements: ['feature.proposals.read'], // Avoid for regular features
});
```

---

## 7. Developer Experience

### Principle 7.1: Quality Gates

**Philosophy**: Automated validation before commit.

```bash
# Required before commit
npm run type-check        # 0 errors required
npm run quality:check     # Lint + format
npm run test              # Critical tests pass
```

---

### Principle 7.2: Documentation Standards

**Philosophy**: Self-documenting code with strategic comments.

#### When to Document

- **Complex algorithms**: Explain why, not what
- **Business rules**: Document rationale
- **Performance optimizations**: Explain tradeoffs
- **Security considerations**: Document threats mitigated

#### When NOT to Document

- **Self-explanatory code**: Good naming > comments
- **Standard patterns**: Follow established examples
- **Simple operations**: Clear code needs no comment

---

### Principle 7.3: Testing Philosophy

**Philosophy**: Test critical paths, not implementation details.

#### Test Priorities

1. **Critical User Flows**: Registration, authentication, proposal creation
2. **Business Logic**: Pricing calculations, permissions, validations
3. **Integration Points**: API routes, database operations
4. **Edge Cases**: Boundary conditions, error scenarios

#### Don't Test

- **Implementation details**: Internal functions
- **Third-party code**: Trust external libraries
- **UI snapshots**: Brittle and low value

---

### Principle 7.4: Feature Flags & Gradual Rollouts

**Philosophy**: Gate risky features behind toggles.

```typescript
// ✅ Feature flag pattern
const isNewFeatureEnabled = useFeatureFlag('new-feature');
if (!isNewFeatureEnabled) return <LegacyFeature />;

// Server-side gating in routes
export const POST = createRoute({
  requirePaid: true,  // Feature flag check
  permissions: ['feature:write']
}, async ({ body }) => { ... });
```

**Default**: Safe-off in production, env-configured rollout.

---

### Principle 7.5: Development Workflow

**Philosophy**: Smart dev server with health checks.

```bash
# Smart development
npm run dev:smart         # Auto-kills processes, clears cache
npm run dev:clean         # Fresh start

# Manual control
npm run dev               # Standard Next.js dev
```

---

## 8. Multi-Tenancy

### Principle 8.1: Tenant Isolation is Non-Negotiable

**Philosophy**: Every query is tenant-scoped. Cross-tenant access = security
violation.

#### Implementation

```typescript
// ✅ REQUIRED: Always filter by tenant
async function getCustomers(tenantId: string) {
  if (!tenantId) throw securityViolation();
  return await prisma.customer.findMany({ where: { tenantId } });
}

// ❌ FORBIDDEN: No tenant filter
async function getCustomers() {
  return await prisma.customer.findMany(); // SECURITY VIOLATION!
}
```

---

### Principle 8.2: Tenant Context Flow

**Philosophy**: Extract tenantId from JWT, never from client input.

```
Login → JWT (tenantId) → Session → API → Service → Prisma Middleware → DB
         ↓ Locked         ↓ Validated  ↓ Enforced   ↓ Automatic    ↓ Filtered
```

```typescript
// ✅ From JWT/session context
const tenantId = getCurrentTenant(); // AsyncLocalStorage

// ❌ From request body
const { tenantId } = await req.json(); // Client can fake this!
```

---

### Principle 8.3: Multi-Layer Defense

**Philosophy**: 8 layers enforce tenant isolation.

| Layer                | Mechanism               | Enforcement        |
| -------------------- | ----------------------- | ------------------ |
| 1. JWT Token         | tenantId locked at auth | Immutable          |
| 2. Session           | Token validation        | Every request      |
| 3. Middleware        | Header verification     | Automatic          |
| 4. Route Guards      | Permission checks       | createRoute()      |
| 5. Services          | Explicit filtering      | Manual             |
| 6. Prisma Middleware | Auto-inject WHERE       | Automatic          |
| 7. Database Indexes  | tenantId prefix         | Query optimization |
| 8. Audit Logs        | Track access            | Compliance         |

---

### Principle 8.4: Super Admin Exception (Audit Required)

**Philosophy**: Cross-tenant access ONLY for Super Admin + audit trail.

```typescript
// ✅ ONLY exception: Explicit Super Admin with logging
async function crossTenantQuery(user: User) {
  if (user.role !== 'Super Admin') throw forbidden();

  logInfo('Cross-tenant access', {
    userId: user.id,
    justification: 'Platform admin',
    auditRequired: true,
  });

  return await prisma.tenant.findMany(); // No tenant filter
}
```

**See**: [MULTI_TENANT_WORKFLOW.md](./MULTI_TENANT_WORKFLOW.md),
[MULTI_TENANT_SECURITY_WORKFLOW.md](./MULTI_TENANT_SECURITY_WORKFLOW.md)

---

## 9. Observability & API Contracts

### Principle 9.1: Request Correlation & Tracing

**Philosophy**: Every request gets unique ID, propagated through logs/errors.

```typescript
// ✅ Automatic in all routes
export const GET = createRoute({ ... }, async ({ requestId }) => {
  logInfo('Processing request', {
    component: 'ProductAPI',
    operation: 'GET',
    requestId,  // Unique per request
    tenantId,   // Tenant context
    userId
  });
});

// Response headers
x-request-id: abc-123-def
x-tenant-id: tenant_xyz
```

**Benefits**: Debug production issues, trace request flow, correlate errors.

---

### Principle 9.2: API Versioning & Deprecation

**Philosophy**: Explicit version headers, graceful deprecation.

```typescript
// ✅ API version + deprecation notice
export const GET = createRoute({
  apiVersion: '2',
  deprecated: {
    sunset: 'Wed, 11 Nov 2026 23:59:59 GMT',
    link: '/docs/api/v3-migration',
    message: 'Migrate to v3 by Nov 2026'
  }
}, async () => { ... });

// Response includes:
// x-api-version: 2
// Deprecation: true
// Sunset: Wed, 11 Nov 2026 23:59:59 GMT
// Link: </docs/api/v3-migration>; rel="deprecation"
```

---

### Principle 9.3: Idempotency Keys

**Philosophy**: Prevent duplicate operations on retries.

```typescript
// ✅ Automatic for all mutating routes
export const POST = createRoute(
  {
    idempotency: {
      enabled: true, // Default for POST/PUT/PATCH
      ttlSeconds: 86400, // 24 hours
      scope: 'user', // Per-user deduplication
    },
  },
  async ({ body }) => {
    // Duplicate requests return cached response
    return await createProposal(body);
  }
);

// Client sends:
// Idempotency-Key: client-generated-uuid
```

**Implementation**: Redis-backed cache with tenant + user + payload hashing.

---

### Principle 9.4: Structured Logging with Context

**Philosophy**: All logs include structured metadata for searchability.

```typescript
// ✅ Rich context in every log
logInfo('Operation succeeded', {
  component: 'CustomerService',
  operation: 'createCustomer',
  requestId,
  tenantId,
  userId,
  customerId: result.id,
  duration: Date.now() - startTime,
  userStory: 'US-2.1',
  hypothesis: 'H4',
});

// Production log aggregation ready (JSON)
```

**Key Fields**: component, operation, requestId, tenantId, userId, duration

---

## Summary: Key Principles by Priority

### 🔴 Critical (Must Follow)

1. **Tenant Isolation**: Every query filtered by tenantId
2. **useApiClient Pattern**: No direct fetch(), no custom caching
3. **TypeScript Zero Tolerance**: 0 errors before commit
4. **Thin Routes**: Delegate all logic to services
5. **Fail Fast Security**: Production must throw on violations

### 🟡 High Priority (Strong Recommendation)

6. **Optimization Hierarchy**: Database first, architecture last
7. **Trace to Root Cause**: Fix causes, not symptoms
8. **Entry Point Validation**: Check data when it enters
9. **Transaction Patterns**: Atomic multi-step operations
10. **2-Year Developer Test**: Code clarity over cleverness

### 🟢 Standard Practice (Follow Consistently)

11. **Correlation IDs**: Track every request end-to-end
12. **API Versioning**: Explicit versions + deprecation
13. **Idempotency Keys**: Prevent duplicate mutations
14. **Feature Flags**: Safe rollouts, gradual releases
15. **Multi-Layer Tenant Defense**: 8 isolation layers

---

## Quick Decision Tree

### "Should I...?"

**...create a custom caching layer?** ❌ **NO** - Use React Query built-in
caching

**...use direct fetch() in a component?** ❌ **NO** - Always use useApiClient
pattern

**...add Prisma queries to API routes?** ❌ **NO** - Delegate to database
services

**...skip TypeScript errors temporarily?** ❌ **NO** - Zero tolerance, fix
immediately

**...optimize architecture first?** ❌ **NO** - Database optimization first (70%
of gains)

**...store server data in Zustand?** ❌ **NO** - React Query handles all server
state

**...hardcode permissions in routes?** ❌ **NO** - Use dynamic database
permissions

**...use offset-based pagination?** ❌ **NO** - Cursor-based for scale

**...log and continue on security errors in production?** ❌ **NO** - Fail fast,
throw errors

**...write clever code to save lines?** ❌ **NO** - Explicit and clear over
clever

**...trust client-provided tenantId?** ❌ **NO** - Extract from JWT only,
validate at every layer

**...allow cross-tenant queries?** ❌ **NO** - Super Admin only, with audit
logging

**...use raw SQL ($queryRaw/$executeRaw)?** ❌ **NO** - Use Prisma ORM with
explicit tenantId. Raw SQL only for rare cases (complex aggregations, bulk 100k+ ops)

**...skip correlation IDs in logs?** ❌ **NO** - Every log must include
requestId + context

**...version my API?** ✅ **YES** - Use x-api-version header + deprecation
notices

**...require idempotency keys?** ✅ **YES** - All POST/PUT/PATCH routes support
them

---

**END OF DOCUMENT**

This philosophy is the foundation for all development decisions. When in doubt,
refer back to these principles. They represent hard-learned lessons from
production incidents, performance optimization, and real-world usage patterns.

**Review Frequency**: Quarterly or after major incidents **Update Process**:
Lessons learned must be incorporated within 48 hours of resolution
