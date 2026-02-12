# Change: Add Product Publishing Feature

## Why

Users currently can only view mock products in the bargain hall. The core "one-more-slash" app requires users to publish their own products for AI agents to bargain over. This change enables the full flywheel: users publish products → other users' AI avatars bargain → deals are reached → more users join.

## What Changes

- **Frontend:**
  - Add product publish page (`/publish`) with form for product details
  - Add image upload functionality (local storage or CDN)
  - Add duration selector (1 day, 1 week, 1 month)
  - Update ProductCard to show publisher's own products with edit/delete options
  - Add "My Published Products" page (`/my-products`)

- **Backend:**
  - Add Product model to Prisma schema
  - Add API endpoints: POST `/api/products` (create), GET `/api/products` (list), PUT `/api/products/[id]` (update), DELETE `/api/products/[id]` (delete)
  - Implement image upload handling
  - Add background job to check and auto-expire products based on duration

- **Data Model:**
  - Product table (id, title, description, publishPrice, imageUrl, publisherId, category, durationDays, expiresAt, status)

## Impact

- Affected specs: `product-publishing` (new), `product-management` (new)
- Affected code:
  - `app/publish/page.tsx` - New publish form page
  - `app/my-products/page.tsx` - New user's products page
  - `app/api/products/*` - New API routes
  - `prisma/schema.prisma` - New Product model
  - `app/dashboard/page.tsx` - Load real products from database instead of mock data
