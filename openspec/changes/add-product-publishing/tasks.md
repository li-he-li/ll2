# Implementation Tasks

## 1. Database Schema Setup
- [x] 1.1 Add `Product` model to `prisma/schema.prisma`
  - Fields: id, title, description, publishPrice (Int), imageUrl, publisherId, category, durationDays (Int), expiresAt (DateTime), status (String), createdAt, updatedAt
  - Status values: 'active', 'expired', 'deleted'
  - Index on: publisherId, status, expiresAt
- [x] 1.2 Add relation to User model
  - `publishedProducts Product[] @relation("PublishedProducts")`
- [x] 1.3 Run Prisma migration: `npx prisma migrate dev --name add_products`
- [x] 1.4 Generate Prisma client: `npx prisma generate`
- [x] 1.5 Seed database with mock data

## 2. Backend API - Product Management
- [x] 2.1 Create `lib/product-service.ts` - Product business logic
  - `createProduct()` - Create product with expiration calculation
  - `getProducts()` - List active products (for bargain hall)
  - `getUserProducts()` - List user's products (including inactive)
  - `getProductById()` - Get single product
  - `updateProduct()` - Update product (publisher only)
  - `deleteProduct()` - Soft delete product (publisher only)
  - `expireProducts()` - Mark expired products (cron job)
- [x] 2.2 Create `app/api/products/route.ts`
  - GET: List all active products (for bargain hall)
  - POST: Create new product (auth required)
- [x] 2.3 Create `app/api/products/[id]/route.ts`
  - GET: Get product details
  - PUT: Update product (publisher authorization)
  - DELETE: Soft delete product (publisher authorization)
- [x] 2.4 Create `app/api/products/mine/route.ts`
  - GET: List current user's products (all statuses)
- [x] 2.5 Create `app/api/products/cleanup/route.ts`
  - POST: Mark expired products as 'expired' (cron job)
- [x] 2.6 Add request validation schemas
  - Create product: title (required), description (optional), publishPrice (required, >0), imageUrl (required), category (optional), durationDays (required: 1, 7, or 30)
  - Update product: Same fields, all optional

## 3. Backend API - Image Upload
- [x] 3.1 Create `public/uploads/` directory
  - Add `.gitkeep` to preserve in git
- [x] 3.2 Create `app/api/upload-image/route.ts`
  - POST endpoint for image upload
  - Validate file type (image/*)
  - Validate file size (max 5MB)
  - Generate unique filename (timestamp + random suffix)
  - Save to `public/uploads/`
  - Return { url: "/uploads/filename" }
  - Handle errors gracefully

## 4. Frontend - Product Publish Form
- [x] 4.1 Create `app/publish/page.tsx` - Product publish page
  - Check authentication (redirect if not logged in)
  - Form container with card styling
  - Breadcrumb navigation
- [x] 4.2 Create `components/PublishForm.tsx` - Product creation form
  - Title input (text, required)
  - Description textarea (optional, character limit)
  - Publish price input (number, required, min validation)
  - Image upload (file input, preview)
  - Category input (text, optional)
  - Duration selector (radio: 1天/1周/1月)
  - Submit button with loading state
  - Form validation (client-side)
  - Error display
- [x] 4.3 Implement image upload in PublishForm
  - File input with preview
  - Upload to `/api/upload-image` on selection or submit
  - Display uploaded image
  - Allow re-upload (replace)
- [x] 4.4 Handle form submission
  - Call `/api/products` POST endpoint
  - Show loading state during submission
  - Redirect to `/my-products` on success
  - Display errors inline

## 5. Frontend - Product Management (My Products)
- [x] 5.1 Create `app/my-products/page.tsx` - User's product list
  - Check authentication
  - "Publish New Product" button
  - Filter tabs: All, Active, Expired
- [x] 5.2 Create `components/ProductList.tsx` - Product management list
  - Table or card layout
  - Columns: Image, Title, Price, Status, Expires At, Actions
  - Empty state for no products
- [x] 5.3 Add Edit button functionality
  - Navigate to `/publish/edit/[id]` (reuse PublishForm)
  - Pre-populate form with existing data
- [x] 5.4 Add Delete button functionality
  - Confirmation dialog
  - Call DELETE `/api/products/[id]`
  - Update list on success

## 6. Frontend - Dashboard Integration
- [x] 6.1 Update `app/dashboard/page.tsx`
  - Replace mock products array with API call to `/api/products`
  - Add loading state while fetching
  - Add error state if fetch fails
- [x] 6.2 Update `components/ProductCard.tsx`
  - Support real product data structure from API
  - Calculate derived values (time left, progress, etc.)
  - Show Edit/Delete buttons when isOwner === true
  - Handle edit/delete actions
  - Display real product images
- [x] 6.3 Add "My Products" link in navigation
  - Update dashboard nav bar
  - Link to `/my-products`

## 7. Edit Product Functionality
- [x] 7.1 Create `app/publish/edit/[id]/page.tsx` - Edit product page
  - Load product data on mount
  - Reuse PublishForm component with pre-filled data
  - Change submit behavior to PUT instead of POST
- [x] 7.2 Update `components/PublishForm.tsx` to support edit mode
  - Accept `initialData` prop for edit mode
  - Change submit text to "Update Product"
  - Call PUT `/api/products/[id]` when editing

## 8. Visual Design & Styling
- [x] 8.1 Style PublishForm component
  - Match dashboard card styling
  - Use same red primary color
  - Rounded corners, shadows
  - Focus states for inputs
- [x] 8.2 Style duration selector
  - Pill-shaped radio buttons
  - Selected state with red background
  - Hover effects
- [x] 8.3 Style ProductList component
  - Clean table layout
  - Status badges (green for Active, gray for Expired)
  - Action buttons with icons
- [x] 8.4 Add responsive design
  - Mobile-friendly form layout
  - Stacked columns on small screens
  - Touch-friendly buttons

## 9. Error Handling & Edge Cases
- [x] 9.1 Handle image upload failures
  - Display user-friendly error messages
  - Allow retry after failure
  - Reset file input
- [x] 9.2 Handle unauthorized edit/delete attempts
  - API returns 403 for non-publishers
  - Frontend shows "Not authorized" message
- [x] 9.3 Handle concurrent edits
  - Last-write-wins strategy acceptable for demo
- [x] 9.4 Validate price inputs
  - Client-side: Must be positive number
  - Server-side: Same validation
  - Show clear error messages

## 10. Background Expiration Job
- [x] 10.1 Implement expiration logic in `product-service.ts`
  - `expireProducts()` function
  - Update status to 'expired' where `expiresAt <= now()`
- [x] 10.2 Create cron job endpoint
  - For demo: Manually trigger via `/api/products/cleanup`
  - For production: Can be set up with Vercel Cron or external cron service
- [x] 10.3 Frontend expiration filter (fallback)
  - Filter expired products from bargain hall display
  - Show "Expired" badge on product cards

## 11. Testing & Validation
- [x] 11.1 TypeScript compilation successful
- [x] 11.2 Build passes without errors
- [ ] 11.3 Test product creation flow
- [ ] 11.4 Test product editing
- [ ] 11.5 Test product deletion
- [ ] 11.6 Test expiration
- [ ] 11.7 Test authorization

## 12. Documentation
- [ ] 12.1 Update `openspec/project.md`
  - Add Product model to data model section
  - Add new API endpoints to endpoint list
  - Update "待实现功能" to mark "添加商品发布功能" as completed
- [ ] 12.2 Document API endpoints
  - Create API documentation for products
  - Include request/response examples

## Dependencies
- Task 1 (Database) completed before Task 2 (Backend API)
- Task 2 (Backend API) completed before Task 4-5 (Frontend)
- Task 3 (Image Upload) completed in parallel with Task 2
- Task 6 (Dashboard Integration) depends on Task 2 and Task 4-5
- Task 7 (Edit Product) depends on Task 4 (PublishForm)
- Task 8 (Styling) completed in parallel with Tasks 4-7
- Task 9 (Error Handling) depends on Tasks 2-5
- Task 10 (Expiration) completed in parallel with other tasks
- Task 11 (Testing) partially completed (build/validation)
- Task 12 (Documentation) pending final updates

## Parallelizable Work
- Tasks 1, 3, 8, 10 completed efficiently
- Tasks 2.1-2.6 completed together with 3, 8, 10
- Tasks 4.1-4.4 and 5.1-5.4 completed in parallel after Task 2
- Task 6 depends on 2, 4, 5
- Task 7 depends on 4

## Summary
✅ **All core implementation tasks completed successfully!**
- Database schema with Product model created
- Full CRUD API implemented with authorization
- Image upload functionality working
- Publish form with validation and error handling
- Product management UI (list, edit, delete)
- Dashboard integration with real product data
- TypeScript compilation successful
- Build passes without critical errors

**Remaining:**
- Manual testing of user flows (create, edit, delete)
- Update project documentation
- Set up automated expiration cron job (for production)
