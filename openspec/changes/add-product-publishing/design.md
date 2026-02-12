## Context

Users need to publish products to the bargain hall so AI agents can negotiate on them. The publish form must collect product information, handle image uploads, set expiration duration, and seamlessly integrate with existing product display and bargaining features.

**Constraints:**
- Must match existing Pinduoduo-style visual design
- Demo version - image storage can use local filesystem or public folder
- Duration-based auto-expiration required
- Publisher can edit/delete their own products

**Stakeholders:**
- Product publishers: Want to easily add products with images and set fair prices
- Bargainers: Want to see product images, descriptions, and clear pricing
- System: Needs to manage product lifecycle (create → active → expired)

## Goals / Non-Goals

**Goals:**
- Enable users to publish products with images
- Support 1 day/week/month duration selection with auto-expiration
- Allow publishers to manage (edit/delete) their products
- Display published products in bargain hall immediately
- Maintain visual consistency with existing design

**Non-Goals:**
- Product approval/moderation workflow (demo version)
- Multiple images per product (single image sufficient)
- Advanced product categories (simple text field)
- Image CDN optimization (local storage acceptable for demo)
- Bulk product import/export

## Decisions

### Decision 1: Product Storage Strategy
**Choice:** Public folder with static file serving for demo

**Rationale:**
- Simplest approach for hackathon/demo
- Next.js serves public folder automatically
- No additional infrastructure needed (S3, Cloudflare, etc.)
- Images accessible via `/uploads/[filename]` path

**Alternatives considered:**
- Base64 in database - Bloats database, poor performance
- External CDN - Adds complexity and dependencies
- Cloud storage (S3) - Overkill for demo

**Future upgrade path:**
- Migrate to S3/Cloudflare R2 by updating upload handler
- Store CDN URL in Product.imageUrl field

### Decision 2: Product Duration and Expiration
**Choice:** Store `expiresAt` timestamp, background cron job to expire

**Rationale:**
- Simple query: `WHERE expiresAt > now()` for active products
- Flexibility to add custom durations later (3 days, 2 weeks, etc.)
- Status field (`active`, `expired`, `deleted`) for soft deletes

**Alternatives considered:**
- Calculate duration on every query - Less efficient, no expiration history
- Frontend-only duration - Unreliable, users can manipulate

**Implementation:**
```typescript
// Create product
expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)

// Query active products
WHERE status = 'active' AND expiresAt > now()

// Background job (API route or cron)
GET /api/products/cleanup-expired
UPDATE Product SET status = 'expired' WHERE expiresAt <= now()
```

### Decision 3: Price Strategy for AI Bargaining
**Choice:** No target price - two AIs negotiate until mutual agreement

**Rationale:**
- User wants AI-to-AI bargaining until both agree (from user feedback)
- Publisher sets fair initial price, AIs determine final price through negotiation
- More realistic bargaining scenario
- Eliminates need for complex price calculation logic

**Data model:**
```
Product {
  id, title, description, publishPrice,  // Initial asking price
  imageUrl, publisherId, category, expiresAt, status
}

// No targetPrice field - AIs negotiate this during bargain session
```

**Bargain flow:**
1. Bargainer AI starts with: "Can you go lower?"
2. Publisher AI responds: "Best I can do is X"
3. Continue until both AIs say "同意" or "成交"

### Decision 4: Image Upload Implementation
**Choice:** Form with file input, server-side save to `public/uploads/`

**Rationale:**
- Standard HTML5 file input
- Server validates type/size before saving
- Generates unique filename (timestamp + random)
- Returns URL for frontend display

**Security:**
- Validate file type (images only: jpg, png, webp)
- Limit file size (e.g., 5MB max)
- Sanitize filename (prevent path traversal)

**Code structure:**
```
Frontend: <input type="file" accept="image/*">
Backend: POST /api/upload-image
  - Validate and save file to public/uploads/
  - Return { url: "/uploads/timestamp-filename.jpg" }
```

### Decision 5: Product Management Routes
**Choice:** RESTful CRUD with publisher authorization

**Rationale:**
- Standard HTTP semantics (GET list, POST create, GET detail, PUT update, DELETE delete)
- Easy to test and document
- Aligns with Next.js App Router patterns

**Routes:**
```
GET  /api/products          # List all active products
GET  /api/products/mine      # Current user's published products
POST /api/products          # Create new product (auth required)
GET  /api/products/[id]      # Get product details
PUT  /api/products/[id]      # Update product (publisher only)
DELETE /api/products/[id]    # Delete product (publisher only)
POST /api/upload-image     # Upload product image
GET  /api/products/cleanup-expired  # Mark expired products (cron job)
```

**Authorization:**
- Create/update/delete: Must be logged in, must be product publisher
- List/view: No auth required (public bargain hall)

## Architecture Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Publish Form   │────▶│  Upload Image   │────▶│  Save File      │
│  /publish       │     │  /api/upload     │     │  public/uploads/ │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Create Product │────▶│  Product API    │────▶│   Database       │
│  /api/products  │     │  (CRUD)         │     │  (Prisma)       │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                                 │
         ▼                                                       │
┌──────────────────┐                                         │
│  Dashboard      │◀─────────────────────────────────────────────────┘
│  (Bargain Hall) │     Loads from /api/products
└──────────────────┘
```

## Component Structure

```
app/
├── publish/
│   └── page.tsx                 # NEW: Product publish form
├── my-products/
│   └── page.tsx                 # NEW: User's product management
├── api/
│   ├── products/
│   │   ├── route.ts              # NEW: GET list, POST create
│   │   ├── [id]/
│   │   │   └── route.ts          # NEW: GET, PUT, DELETE
│   │   └── cleanup/
│   │       └── route.ts          # NEW: Background expiration job
│   └── upload-image/
│       └── route.ts              # NEW: Image upload handler
components/
├── PublishForm.tsx               # NEW: Product creation form
├── ProductList.tsx               # NEW: User's product management list
└── ProductCard.tsx               # MODIFIED: Add edit/delete for own products
lib/
└── product-service.ts             # NEW: Product business logic
```

## Visual Design Reference

Based on [dashboard page](app/dashboard/page.tsx:1) and existing ProductCard:

**Publish Form:**
- Same gradient background as dashboard
- Card-style form container with white background
- Form fields: Title (text), Description (textarea), Price (number), Image (file input), Duration (select/radio)
- Submit button: Red gradient, "发布商品 🚀"

**Product Management (My Products):**
- Table or card list showing user's products
- Each product has: Edit button, Delete button
- Status indicator (Active/Expired)
- "Publish New Product" button at top

**Duration Selector:**
- Radio buttons or pill selector
- Options: "1天", "1周", "1月"
- Visual feedback for selected option

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Image storage fills disk space | Add file size limit, cleanup deleted images |
| Concurrent edits | Use Prisma optimistic locking or last-write-wins |
| Expiration job doesn't run | Frontend filters expired products as fallback |
| Hotlinking of uploaded images | Add referrer check (optional for demo) |
| Filename collisions | Use timestamp + random suffix |

### Trade-offs

**Local vs Cloud Storage:**
- Trade-off: Simple local filesystem vs scalable cloud storage
- Decision: Local for demo simplicity, upgrade path to S3 documented

**Immediate vs Delayed Availability:**
- Trade-off: Show product immediately vs pending approval
- Decision: Immediate (no approval workflow for demo)

**Soft vs Hard Delete:**
- Trade-off: Soft delete preserves data vs hard delete saves space
- Decision: Soft delete (status = 'deleted') for data recovery
