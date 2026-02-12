# Product Publishing Capability Specification

## ADDED Requirements

### Requirement: Product Creation Form

The system SHALL provide a form for authenticated users to publish new products with images, pricing, and duration settings.

#### Scenario: Access publish form
- **WHEN** a logged-in user navigates to `/publish` OR clicks "+ 发布商品" button
- **THEN** system SHALL display product publish form
- **AND** form SHALL include fields for: title, description, publish price, product image, category (optional), duration selection

#### Scenario: Upload product image
- **WHEN** user selects an image file from the file input
- **THEN** system SHALL upload image to `/api/upload-image`
- **AND** validate file type (jpg, png, webp only)
- **AND** validate file size (max 5MB)
- **AND** display image preview after successful upload
- **AND** store image URL for form submission

#### Scenario: Fill product details
- **WHEN** user fills out the publish form
- **THEN** system SHALL validate:
  - Title is required (min 2 characters, max 100)
  - Publish price is required (positive integer)
  - Description is optional (max 500 characters)
  - Duration is selected (1天, 1周, or 1月)
- **AND** show inline validation errors for invalid inputs

#### Scenario: Select publish duration
- **WHEN** user chooses a duration option
- **THEN** system SHALL calculate `expiresAt` timestamp:
  - 1天: Current time + 24 hours
  - 1周: Current time + 7 days
  - 1月: Current time + 30 days
- **AND** store durationDays value (1, 7, or 30)

#### Scenario: Submit product for publishing
- **WHEN** user submits valid product form
- **THEN** system SHALL create product via POST `/api/products`
- **AND** set product status to `active`
- **AND** redirect to `/my-products` page
- **AND** show success message
- **AND** product becomes visible in bargain hall immediately

### Requirement: Image Upload Handling

The system SHALL handle product image uploads with validation and storage.

#### Scenario: Upload image successfully
- **WHEN** valid image file is submitted to `/api/upload-image`
- **THEN** system SHALL save file to `public/uploads/` directory
- **AND** generate unique filename (timestamp + random suffix)
- **AND** return JSON response: `{ url: "/uploads/filename.ext" }`
- **AND** respond with HTTP 200

#### Scenario: Reject invalid file type
- **WHEN** uploaded file is not an image (jpg, png, webp)
- **THEN** system SHALL reject upload
- **AND** return HTTP 400 with error message "只支持上传图片文件 (jpg, png, webp)"

#### Scenario: Reject oversized file
- **WHEN** uploaded file exceeds 5MB
- **THEN** system SHALL reject upload
- **AND** return HTTP 400 with error message "图片大小不能超过 5MB"

#### Scenario: Handle upload errors
- **WHEN** file system write fails
- **THEN** system SHALL return HTTP 500
- **AND** log error for debugging
- **AND** frontend SHALL display user-friendly error message

### Requirement: Product Publication Workflow

The system SHALL provide complete workflow from form submission to bargain hall display.

#### Scenario: Product appears in bargain hall immediately
- **WHEN** product is successfully created with status `active`
- **THEN** product SHALL appear in bargain hall (`/dashboard`)
- **AND** display in product grid with all other products
- **AND** be visible to all users

#### Scenario: Product persists in database
- **WHEN** product is created
- **THEN** system SHALL persist to database:
  - id (unique)
  - title
  - description
  - publishPrice (integer, in cents)
  - imageUrl
  - publisherId (references current user)
  - category
  - durationDays
  - expiresAt (calculated timestamp)
  - status (`active`)
  - createdAt, updatedAt

#### Scenario: Redirect to product management after publish
- **WHEN** product creation succeeds
- **THEN** system SHALL redirect user to `/my-products`
- **AND** show success notification "商品发布成功！"

#### Scenario: Show publish form only to authenticated users
- **WHEN** unauthenticated user accesses `/publish`
- **THEN** system SHALL redirect to login page
- **OR** show login prompt

### Requirement: Product Duration and Expiration

The system SHALL support time-limited product listings with automatic expiration.

#### Scenario: Calculate expiration timestamp
- **WHEN** product is created with duration selection
- **THEN** system SHALL calculate `expiresAt = createdAt + (durationDays * 24 * 60 * 60 * 1000ms`

#### Scenario: Auto-expire products
- **WHEN** scheduled cleanup job runs (or `/api/products/cleanup` is called)
- **THEN** system SHALL update all products where `expiresAt <= now()`
- **AND** set their status to `expired`
- **AND** expired products SHALL NOT appear in bargain hall

#### Scenario: Filter expired products from bargain hall
- **WHEN** bargain hall loads products
- **THEN** system SHALL only return products where `status = 'active'` AND `expiresAt > now()`
- **AND** exclude `expired` and `deleted` products

### Requirement: Publish Form Visual Design

The system SHALL provide an intuitive, visually consistent product publishing interface.

#### Scenario: Form layout and styling
- **WHEN** publish form is displayed
- **THEN** it SHALL use same design tokens as dashboard:
  - Primary color: `#E54C3C` (Pinduoduo red)
  - Card background: White with shadow
  - Rounded corners on all containers
  - Gradient page background

#### Scenario: Duration selector visual design
- **WHEN** duration options are displayed
- **THEN** they SHALL appear as pill-shaped radio buttons
- **AND** selected option SHALL have red background
- **AND** unselected options SHALL have gray/white background
- **AND** hover effect SHALL indicate interactivity

#### Scenario: Image upload preview
- **WHEN** image is uploaded
- **THEN** system SHALL display preview of uploaded image
- **AND** show file name or size
- **AND** provide "Remove" or "Replace" option

#### Scenario: Form validation feedback
- **WHEN** user submits invalid form
- **THEN** system SHALL highlight invalid fields
- **AND** show error message below each invalid field
- **AND** prevent form submission
- **AND** scroll to first error
