# Bargaining Capability Specification

## ADDED Requirements

### Requirement: Bargain Session Management

The system SHALL support creation and tracking of bargain sessions between a product publisher and a bargainer.

#### Scenario: Create bargain session from product card
- **WHEN** a logged-in user clicks "bargain button" on a product card
- **THEN** the system SHALL create a new bargain session
- **AND** redirect to `/bargain/{sessionId}` page
- **AND** session SHALL be initialized with status `negotiating`

#### Scenario: Retrieve existing bargain session
- **WHEN** user navigates to `/bargain/{sessionId}`
- **THEN** the system SHALL display the chat interface
- **AND** load all historical messages for that session
- **AND** show product information (title, current price, target price)

#### Scenario: Bargain session completion
- **WHEN** AI negotiation reaches agreement or maximum exchanges
- **THEN** the system SHALL update session status to `completed`
- **AND** store the final agreed price
- **AND** display completion summary to user

### Requirement: Real-time Chat Message Streaming

The system SHALL provide real-time delivery of AI chat messages using Server-Sent Events.

#### Scenario: Stream messages during active bargain
- **WHEN** user has an active bargain session open
- **THEN** the system SHALL stream new messages as they arrive
- **AND** display messages in chronological order
- **AND** differentiate between publisher and bargainer messages visually

#### Scenario: Handle connection interruption
- **WHEN** SSE connection is interrupted
- **THEN** the client SHALL attempt automatic reconnection
- **AND** resume streaming from last received message

#### Scenario: Message format and content
- **WHEN** a message is streamed
- **THEN** it SHALL contain: sender ID, sender role (publisher/bargainer), content, timestamp
- **AND** display with appropriate avatar and styling

### Requirement: Bargain Data Persistence

The system SHALL persist bargain sessions and messages for replay and reference.

#### Scenario: Store bargain session
- **WHEN** a bargain session is created
- **THEN** the system SHALL store: session ID, product ID, publisher ID, bargainer ID, initial price, target price, status
- **AND** assign a unique session identifier

#### Scenario: Store chat messages
- **WHEN** a chat message is sent (either by AI or user)
- **THEN** the system SHALL store: message ID, session ID, sender ID, sender role, content, timestamp, isFromAI flag
- **AND** link message to the corresponding bargain session

#### Scenario: View historical bargain
- **WHEN** user navigates to a completed bargain session
- **THEN** the system SHALL display the full message history
- **AND** show the session as read-only (no new messages allowed)

### Requirement: Bargain Page User Interface

The system SHALL provide a chat interface matching the application's visual style for bargaining.

#### Scenario: Display chat interface
- **WHEN** user accesses `/bargain/{sessionId}`
- **THEN** the system SHALL display:
  - Product header (image, title, price progress bar)
  - Scrollable message container
  - Publisher AI avatar on right side
  - Bargainer AI avatar on left side
  - Status indicator (negotiating/completed)

#### Scenario: Visual styling consistency
- **WHEN** the bargain page is rendered
- **THEN** it SHALL use the same design tokens as the dashboard:
  - Primary color: `#E54C3C`
  - Card backgrounds: White with shadow
  - Rounded corners on containers
  - Gradient background matching main page

#### Scenario: Show bargain progress
- **WHEN** a bargain session is active
- **THEN** the system SHALL display current agreed price
- **AND** show price reduction from original price
- **AND** update in real-time as AI negotiates

### Requirement: Bargain Session Status Transitions

The system SHALL manage bargain session lifecycle through defined states.

#### Scenario: Session state progression
- **WHEN** a bargain session is created
- **THEN** status SHALL be set to `negotiating`
- **WHEN** AI agents reach agreement OR timeout occurs
- **THEN** status SHALL transition to `completed`
- **WHEN** an error occurs during API communication
- **THEN** status MAY transition to `failed`

#### Scenario: Prevent interaction on completed sessions
- **WHEN** a bargain session has status `completed` or `failed`
- **THEN** no new messages SHALL be sent
- **AND** the UI SHALL display the session in read-only mode

### Requirement: Product Card Integration

The system SHALL integrate bargain functionality into the existing product card navigation flow.

#### Scenario: Navigate to bargain from product card
- **WHEN** user clicks the "bargain button" on a product card in the dashboard
- **THEN** the system SHALL create a new bargain session for that product
- **AND** redirect the user to `/bargain/{newSessionId}`

#### Scenario: Button label and styling
- **WHEN** the product card is displayed
- **THEN** the bargain button SHALL display text "帮他砍一刀 🔪"
- **AND** use the same button styling as other UI elements (red gradient, rounded-full)
- **AND** have hover scale effect for visual feedback
