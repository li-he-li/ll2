# Spec: Database Migration

## ADDED Requirements

### Requirement: PostgreSQL datasource support
The system MUST support PostgreSQL as the primary database in production environment while maintaining SQLite for local development.

#### Scenario: Use PostgreSQL in production
**Given** the application is running in production environment
**When** the application initializes the database connection
**Then** the system uses PostgreSQL as the datasource
**And** connects to Vercel Postgres (or other PostgreSQL provider)

#### Scenario: Fallback to SQLite in development
**Given** the application is running in local development environment
**When** the DATABASE_URL starts with "file:"
**Then** the system uses SQLite as the datasource
**And** connects to the local file-based database

### Requirement: Database connection pooling
The system MUST use Prisma Connection Pool for PostgreSQL in production to enable efficient database connections and improve performance.

#### Scenario: Connection pool configuration
**Given** the application is in production environment
**When** database connections are needed
**Then** the system uses Prisma Connection Pool
**And** the connection pool is configured with appropriate pool size limits

### Requirement: Database schema compatibility
The database schema MUST be compatible with both SQLite and PostgreSQL to enable zero-downtime migrations.

#### Scenario: Universal schema works with both databases
**Given** the Prisma schema is defined
**When** the schema is synchronized with either SQLite or PostgreSQL
**Then** both databases can use the same schema
**And** no database-specific modifications are required

### Requirement: Data migration tooling
The system MUST provide utilities to export existing SQLite data and import it into PostgreSQL.

#### Scenario: Export SQLite data
**Given** the application has existing data in SQLite
**When** the developer runs the export command
**Then** the system exports all data to SQL format
**And** includes users, products, bargain sessions, and messages

#### Scenario: Import data to PostgreSQL
**Given** the developer has exported SQLite data
**When** the developer runs the import command
**Then** the system imports the data into PostgreSQL
**And** preserves all relationships and data integrity
