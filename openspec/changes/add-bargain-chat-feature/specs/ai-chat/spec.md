# AI Chat Capability Specification

## ADDED Requirements

### Requirement: SecondMe Chat API Integration

The system SHALL integrate with SecondMe Chat API to enable AI-to-AI bargaining conversations.

#### Scenario: Initialize AI chat session
- **WHEN** a bargain session is created
- **THEN** the system SHALL retrieve access tokens for both publisher and bargainer
- **AND** initialize a SecondMe chat session using their respective AI agents
- **AND** provide context (product details, target price) to both agents

#### Scenario: Send message through SecondMe API
- **WHEN** the system needs to send a message as an AI agent
- **THEN** it SHALL use the stored OAuth access token for that user
- **AND** call the SecondMe chat API endpoint
- **AND** store the API response locally

#### Scenario: Handle token refresh
- **WHEN** an API call returns 401 Unauthorized
- **THEN** the system SHALL attempt to refresh the access token
- **AND** retry the original request with new token
- **AND** if refresh fails, mark bargain session as `failed`

### Requirement: AI Agent Conversation Management

The system SHALL orchestrate autonomous dialogue between the product publisher's AI and the bargainer's AI.

#### Scenario: Start AI negotiation
- **WHEN** a bargain session begins
- **THEN** the system SHALL send initial context to both AI agents
- **AND** instruct the bargainer AI to start the negotiation
- **AND** instruct the publisher AI to respond to bargain requests

#### Scenario: Exchange messages between AIs
- **WHEN** one AI agent sends a message
- **THEN** the system SHALL deliver it to the other AI agent
- **AND** await response from the receiving agent
- **AND** continue the exchange until agreement or limit reached

#### Scenario: Detect bargaining completion
- **WHEN** the publisher AI responds with agreement phrases (e.g., "同意", "成交", "好的")
- **THEN** the system SHALL mark the bargain session as completed
- **AND** record the final agreed price
- **AND** stop further message exchanges

#### Scenario: Enforce exchange limit
- **WHEN** the number of message exchanges exceeds the configured limit (default: 10)
- **THEN** the system SHALL auto-complete the bargain session
- **AND** use the last offered price as the final price
- **AND** notify user that maximum exchanges was reached

### Requirement: Chat API Error Handling

The system SHALL gracefully handle errors from the SecondMe Chat API.

#### Scenario: Handle API timeout
- **WHEN** a SecondMe API request times out
- **THEN** the system SHALL retry up to 3 times with exponential backoff
- **AND** if all retries fail, mark session as `failed`
- **AND** display error message to user

#### Scenario: Handle rate limiting
- **WHEN** SecondMe API returns 429 Too Many Requests
- **THEN** the system SHALL wait for the retry-after duration
- **AND** resume message streaming
- **AND** display "waiting for response" indicator to user

#### Scenario: Handle invalid AI response
- **WHEN** SecondMe API returns a malformed or empty response
- **THEN** the system SHALL log the error
- **AND** send a fallback message (e.g., "抱歉，我暂时无法回应，请稍后再试")
- **AND** continue the session if possible

### Requirement: Message Content Moderation

The system SHALL ensure AI-generated content remains appropriate and context-relevant.

#### Scenario: Validate message content
- **WHEN** an AI message is received from SecondMe API
- **THEN** the system SHALL validate content is not empty
- **AND** check for prohibited content (abuse, harassment, etc.)
- **AND** reject inappropriate messages

#### Scenario: Provide bargaining context to AI
- **WHEN** initializing the AI chat session
- **THEN** the system SHALL include context:
  - Product name and description
  - Original price and target price
  - Bargaining role instructions (negotiate lower / defend price)
- **AND** set expected tone (polite, reasonable negotiation)

### Requirement: Chat Message Storage

The system SHALL store all AI chat messages for history and replay.

#### Scenario: Store incoming AI message
- **WHEN** a message is received from SecondMe API
- **THEN** the system SHALL store it with:
  - Session ID
  - Sender user ID
  - Sender role (publisher or bargainer)
  - Message content
  - Timestamp
  - `isFromAI: true` flag

#### Scenario: Store system notification messages
- **WHEN** a system event occurs (session started, completed, etc.)
- **THEN** the system MAY store a notification message
- **AND** mark it as a system message (not from a specific user)
