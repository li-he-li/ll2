# Spec: Cloud Storage Integration

## ADDED Requirements

### Requirement: Cloud image upload API
The system MUST provide a server-side API endpoint for uploading images to cloud storage instead of local filesystem.

#### Scenario: Upload image via API
**Given** a user is authenticated
**When** they POST an image file to `/api/upload`
**Then** the system validates the file type and size
**And** uploads the image to cloud storage (Vercel Blob or COS)
**And** returns a public URL to access the image
**And** returns metadata including filename, size, and upload timestamp

#### Scenario: Validate image before upload
**Given** a user attempts to upload a file
**When** the file is not an image (jpg, jpeg, png, webp, gif)
**Then** the API returns a 400 error
**And** includes an error message "仅支持图片文件（jpg, jpeg, png, webp, gif）"

#### Scenario: Enforce file size limits
**Given** a user attempts to upload an image larger than 5MB
**When** the API receives the file
**Then** the API returns a 400 error
**And** includes an error message "图片大小不能超过5MB"

### Requirement: Storage abstraction layer
The system MUST provide a storage abstraction layer that supports multiple storage providers.

#### Scenario: Use Vercel Blob in production
**Given** the application is running in production environment
**When** an image upload is requested
**Then** the system uploads to Vercel Blob storage
**And** returns a Vercel Blob public URL

#### Scenario: Use COS in development (optional)
**Given** the application is running in development environment
**When** an image upload is requested
**Then** the system uploads to Tencent COS if configured
**And** returns the COS public URL
**Or** falls back to local filesystem if COS is not configured

### Requirement: Image URL response format
The upload API MUST return a consistent JSON response format regardless of storage provider.

#### Scenario: Successful upload response
**Given** an image is successfully uploaded
**When** the upload operation completes
**Then** the API returns 200 OK status
**And** the response includes:
```json
{
  "url": "https://...",
  "filename": "image-1234567890.jpg",
  "size": 123456,
  "uploadedAt": "2025-01-15T10:30:00Z"
}
```

### Requirement: Image deletion support
The system MUST support deleting images from cloud storage.

#### Scenario: Delete image via API
**Given** an image exists in cloud storage
**When** a DELETE request is made to `/api/upload?url=...`
**Then** the system deletes the image from cloud storage
**And** returns a 200 OK status
**And** the image URL becomes invalid

### Requirement: Storage provider fallback
The system MUST gracefully fallback between storage providers if one fails.

#### Scenario: Vercel Blob failure fallback
**Given** the primary storage is Vercel Blob
**When** Vercel Blob upload fails or returns an error
**Then** the system attempts to use the secondary storage provider if configured
**And** logs the error for debugging
**Or** returns an error if no fallback is available
