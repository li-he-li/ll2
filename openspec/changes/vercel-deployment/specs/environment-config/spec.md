# Spec: Environment Configuration

## ADDED Requirements

### Requirement: Production environment variables
The system MUST support separate environment configurations for development and production.

#### Scenario: Load production variables
**Given** the application is running in production environment (NODE_ENV=production)
**When** the application starts
**Then** the system loads environment variables from `.env.production` or Vercel environment variables
**And** DATABASE_URL points to PostgreSQL connection string
**And** NEXTAUTH_URL points to the production domain (e.g., https://your-app.vercel.app)

#### Scenario: Load development variables
**Given** the application is running in development environment
**When** the application starts
**Then** the system loads environment variables from `.env`
**And** DATABASE_URL points to local SQLite file (file:./dev.db)
**And** NEXTAUTH_URL points to localhost (http://localhost:3000)

### Requirement: Dynamic app URL configuration
The system MUST support dynamic app URL configuration for OAuth callbacks.

#### Scenario: OAuth callback with production URL
**Given** the application is deployed to Vercel
**When** SecondMe OAuth redirects after authentication
**Then** the callback URL is https://your-app.vercel.app/api/auth/callback
**And** the NEXTAUTH_URL environment variable matches this domain

#### Scenario: OAuth callback with development URL
**Given** the application is running locally
**When** SecondMe OAuth redirects after authentication
**Then** the callback URL is http://localhost:3000/api/auth/callback
**And** the NEXTAUTH_URL environment variable matches this domain

### Requirement: Secure environment variable handling
The system MUST ensure sensitive environment variables are never exposed to client-side code.

#### Scenario: Server-only variables
**Given** an environment variable contains sensitive information (API secrets, database passwords)
**When** the variable is accessed
**Then** it MUST only be accessible in server-side code (API routes, server components)
**And** MUST NOT be exposed to client-side code (React components)
**And** variables with sensitive information MUST NOT be prefixed with `NEXT_PUBLIC_`

### Requirement: Database connection string validation
The system MUST validate database connection strings before attempting to connect.

#### Scenario: Valid PostgreSQL connection string
**Given** the DATABASE_URL is configured
**When** the application starts
**Then** the system validates the connection string format
**And** ensures it starts with `postgresql://` or `postgres://`
**Or** returns an error on startup if invalid

#### Scenario: Missing required environment variable
**Given** a required environment variable is not set
**When** the application starts
**Then** the system logs a clear error message
**And** the system exits with a non-zero status code
**And** the error message indicates which variable is missing

### Requirement: Vercel-specific environment variables
The system MUST support Vercel-specific environment variables when deployed to Vercel.

#### Scenario: Vercel Blob storage configuration
**Given** the application is deployed to Vercel and uses Vercel Blob storage
**When** the image upload feature is used
**Then** the BLOB_READ_WRITE_TOKEN environment variable is configured
**And** the token has read and write permissions
**And** uploads succeed to the Vercel Blob storage

#### Scenario: Vercel region configuration
**Given** the application is deployed to Vercel
**When** the application is deployed
**Then** the Vercel region is configured (e.g., hkg1, sfo1, iad1)
**And** the region affects which Vercel data center is used
**And** the region is configured in `vercel.json` or Vercel Dashboard
