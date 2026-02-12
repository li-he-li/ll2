# Product Management Capability Specification

## ADDED Requirements

### Requirement: Product Listing API

The system SHALL provide API endpoints for listing products with filtering capabilities.

#### Scenario: List all active products (bargain hall)
- **WHEN** client requests GET `/api/products`
- **THEN** system SHALL return array of products where:
  - `status = 'active'`
  - `expiresAt > now()`
- **AND** include all product fields except soft-deleted
- **AND** order by `createdAt` descending (newest first)
- **AND** respond with HTTP 200

#### Scenario: List current user's products
- **WHEN** authenticated user requests GET `/api/products/mine`
- **THEN** system SHALL return array of products where:
  - `publisherId` matches current user's ID
- **AND** include all statuses (active, expired, deleted)
- **AND** order by `createdAt` descending
- **AND** respond with HTTP 200

#### Scenario: Get single product details
- **WHEN** client requests GET `/api/products/[id]`
- **THEN** system SHALL return product with matching ID
- **AND** respond with HTTP 200 if found
- **OR** respond with HTTP 404 if not found

#### Scenario: Filter products by status
- **WHEN** client requests GET `/api/products?status=expired`
- **THEN** system SHALL return products filtered by status
- **AND** support status values: `active`, `expired`, `deleted`
- **AND** default to `active` if no status specified

### Requirement: Product Update (Edit)

The system SHALL allow product publishers to edit their own products.

#### Scenario: Edit product details
- **WHEN** authenticated user (publisher) submits PUT to `/api/products/[id]`
- **AND** user is the product publisher
- **THEN** system SHALL update product fields:
  - title (optional)
  - description (optional)
  - publishPrice (optional, must be positive)
  - imageUrl (optional)
  - category (optional)
  - durationDays (optional: 1, 7, 30)
- **AND** recalculate `expiresAt` if `durationDays` changed
- **AND** update `updatedAt` timestamp
- **AND** respond with HTTP 200 and updated product

#### Scenario: Prevent editing other users' products
- **WHEN** authenticated user attempts to PUT `/api/products/[id]`
- **AND** user is NOT the product publisher
- **THEN** system SHALL reject update
- **AND** respond with HTTP 403 Forbidden
- **AND** return error message "无权编辑此商品"

#### Scenario: Edit product with partial data
- **WHEN** publisher submits PUT with partial fields
- **THEN** system SHALL update only provided fields
- **AND** preserve unchanged fields
- **AND** not require all fields

#### Scenario: Validate update data
- **WHEN** publisher submits invalid data (e.g., negative price)
- **THEN** system SHALL reject update
- **AND** respond with HTTP 400
- **AND** return validation errors

### Requirement: Product Deletion

The system SHALL allow product publishers to delete (soft delete) their own products.

#### Scenario: Soft delete product
- **WHEN** authenticated user (publisher) submits DELETE to `/api/products/[id]`
- **AND** user is the product publisher
- **THEN** system SHALL update product status to `deleted`
- **AND** preserve product data in database
- **AND** product SHALL NOT appear in bargain hall
- **AND** respond with HTTP 200

#### Scenario: Prevent deleting other users' products
- **WHEN** authenticated user attempts to DELETE `/api/products/[id]`
- **AND** user is NOT the product publisher
- **THEN** system SHALL reject deletion
- **AND** respond with HTTP 403 Forbidden
- **AND** return error message "无权删除此商品"

#### Scenario: Confirm deletion before proceeding
- **WHEN** user clicks delete button in UI
- **THEN** system SHALL display confirmation dialog
- **AND** ask "确定要删除此商品吗？"
- **AND** only proceed if user confirms

#### Scenario: Show deleted products in management view
- **WHEN** user views their products at `/my-products`
- **THEN** system SHALL show products with status `deleted`
- **AND** display "已删除" badge
- **AND** disable edit/delete actions for deleted products

### Requirement: Product Management UI

The system SHALL provide a user interface for managing published products.

#### Scenario: Display user's products list
- **WHEN** authenticated user navigates to `/my-products`
- **THEN** system SHALL display list of user's products
- **AND** show columns: Image, Title, Price, Status, Expires At, Actions
- **AND** provide filter tabs: All, Active, Expired, Deleted
- **AND** show "发布新商品" button at top

#### Scenario: Show product status badges
- **WHEN** product list is displayed
- **THEN** system SHALL show status badges:
  - `active`: Green "进行中" badge
  - `expired`: Gray "已过期" badge
  - `deleted`: Red "已删除" badge

#### Scenario: Provide edit and delete actions
- **WHEN** product row is displayed
- **AND** product status is `active` or `expired`
- **THEN** system SHALL show:
  - "编辑" button (navigate to edit form)
  - "删除" button (with confirmation)
- **AND** hide or disable actions for `deleted` products

#### Scenario: Navigate to edit form
- **WHEN** user clicks "编辑" button
- **THEN** system SHALL navigate to `/publish/edit/[id]`
- **AND** pre-populate form with existing product data
- **AND** change form title to "编辑商品"
- **AND** change submit button text to "保存修改"

### Requirement: Authorization and Access Control

The system SHALL enforce access control for product management operations.

#### Scenario: Require authentication for product management
- **WHEN** unauthenticated user attempts to:
  - POST `/api/products` (create)
  - PUT `/api/products/[id]` (update)
  - DELETE `/api/products/[id]` (delete)
- **THEN** system SHALL reject request
- **AND** respond with HTTP 401 Unauthorized
- **AND** frontend SHALL redirect to login page

#### Scenario: Verify publisher ownership
- **WHEN** user attempts to update or delete product
- **THEN** system SHALL verify `product.publisherId === user.id`
- **AND** reject if mismatch
- **AND** respond with HTTP 403 Forbidden

#### Scenario: Allow public read access
- **WHEN** any user (authenticated or not) requests:
  - GET `/api/products` (list active)
  - GET `/api/products/[id]` (get details)
- **THEN** system SHALL allow access
- **AND** not require authentication
- **AND** respond with product data

### Requirement: Product Expiration Management

The system SHALL provide tools for managing product expiration.

#### Scenario: Manual expiration cleanup endpoint
- **WHEN** system or admin calls POST `/api/products/cleanup`
- **THEN** system SHALL find all products where:
  - `expiresAt <= now()`
  - `status = 'active'`
- **AND** update their status to `expired`
- **AND** return count of expired products
- **AND** respond with HTTP 200

#### Scenario: Display expiration time in product list
- **WHEN** user views their products
- **THEN** system SHALL display `expiresAt` timestamp
- **AND** show relative time (e.g., "2天后过期", "已过期")
- **AND** highlight products expiring soon (< 24 hours)

#### Scenario: Expired products become inactive
- **WHEN** product status changes to `expired`
- **THEN** product SHALL:
  - NOT appear in bargain hall
  - NOT allow new bargain sessions
  - Still be visible in owner's product list
  - Show "已过期" badge

### Requirement: Edit Form Integration

The system SHALL reuse publish form component for editing products.

#### Scenario: Load product data for editing
- **WHEN** user navigates to `/publish/edit/[id]`
- **THEN** system SHALL fetch product via GET `/api/products/[id]`
- **AND** pre-populate all form fields with product data
- **AND** display current image preview
- **AND** select current duration option

#### Scenario: Update product on form submit
- **WHEN** user submits edit form
- **THEN** system SHALL send PUT to `/api/products/[id]`
- **AND** include only changed fields
- **AND** show loading state during update
- **AND** redirect to `/my-products` on success
- **AND** show success message "商品已更新"

#### Scenario: Handle edit form errors
- **WHEN** product update fails (validation or authorization)
- **THEN** system SHALL display error message
- **AND** keep user on edit form
- **AND** preserve form data

### Requirement: Empty States and Loading

The system SHALL provide appropriate UI states for product management.

#### Scenario: Show empty state when no products
- **WHEN** user has no published products
- **AND** views `/my-products`
- **THEN** system SHALL display empty state message
- **AND** show "还没有发布任何商品"
- **AND** display "发布第一个商品" button

#### Scenario: Show loading state during data fetch
- **WHEN** product list is loading
- **THEN** system SHALL display loading spinner
- **AND** show "加载中..." message
- **AND** skeleton or placeholder UI

#### Scenario: Show error state on API failure
- **WHEN** product list API fails
- **THEN** system SHALL display error message
- **AND** provide "重试" button
- **AND** log error for debugging
