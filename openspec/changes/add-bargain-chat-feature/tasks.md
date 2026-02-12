# Implementation Tasks

## 1. Database Schema Setup
- [x] 1.1 Add `BargainSession` model to `prisma/schema.prisma`
  - Fields: id, productId, publisherId, bargainerId, publishPrice, currentPrice, targetPrice, status, finalPrice, createdAt, completedAt
- [x] 1.2 Add `BargainMessage` model to `prisma/schema.prisma`
  - Fields: id, sessionId, senderId, senderRole, content, timestamp, isFromAI
- [x] 1.3 Run Prisma migration: `npx prisma migrate dev --name add_bargain_tables`
- [x] 1.4 Generate Prisma client: `npx prisma generate`

## 2. Backend API - Bargain Session Management
- [x] 2.1 Create `lib/bargain-service.ts` - Bargain business logic
  - `createBargainSession()` - Create new session
  - `getBargainSession()` - Retrieve session by ID
  - `completeBargainSession()` - Finalize bargain
  - `getBargainMessages()` - Get messages for session
- [x] 2.2 Create `app/api/bargain/route.ts` - POST endpoint to create session
  - Validate user authentication
  - Accept productId in request body
  - Create and return new bargain session
- [x] 2.3 Create `app/api/bargain/[id]/route.ts` - GET session details
  - Return session info and messages
  - Handle 404 for invalid session IDs

## 3. Backend API - SecondMe Chat Integration
- [x] 3.1 Create `lib/secondme-chat.ts` - SecondMe chat API client
  - `sendChatMessage()` - Send message as AI agent
  - `refreshAccessToken()` - Handle token renewal
  - `detectAgreement()` - Detect agreement phrases
  - `extractPrice()` - Extract price from message
- [x] 3.2 Create `app/api/bargain/[id]/stream/route.ts` - SSE streaming endpoint
  - Set up Server-Sent Events response headers
  - Stream messages as they arrive from AI
  - Handle client disconnection
- [x] 3.3 Implement AI conversation orchestration
  - Start conversation with initial context
  - Alternate between bargainer and publisher messages
  - Detect completion phrases ("同意", "成交")
  - Enforce max exchange limit (10)

## 4. Frontend - Bargain Chat Page
- [x] 4.1 Create `app/bargain/[id]/page.tsx` - Bargain chat page
  - Parse sessionId from URL
  - Fetch session details and messages
  - Set up SSE connection for streaming
- [x] 4.2 Create `components/BargainChat.tsx` - Chat container component
  - Display product info header
  - Scrollable message list
  - Status indicator
  - Auto-scroll to latest message
- [x] 4.3 Create `components/ChatMessage.tsx` - Single message display
  - Different styling for publisher vs bargainer
  - Avatar display
  - Timestamp
  - Message content
- [x] 4.4 Create `components/ProductBargainHeader.tsx` - Product info header
  - Product thumbnail/placeholder
  - Title and price info
  - Progress bar showing price reduction
  - Current status indicator
- [x] 4.5 Implement SSE client hook `hooks/useSSE.ts`
  - Connect to SSE endpoint
  - Handle incoming messages
  - Auto-reconnect on disconnect
  - Cleanup on unmount

## 5. Frontend - Product Card Integration
- [x] 5.1 Update `components/ProductCard.tsx`
  - Add `id` prop to ProductCard interface
  - Add `onClick` handler to bargain button
  - Navigate to `/bargain/{id}` on button click
- [x] 5.2 Update `app/dashboard/page.tsx`
  - Pass `id` to each ProductCard component
  - Ensure mock products have unique IDs

## 6. Visual Design & Styling
- [x] 6.1 Apply Pinduoduo-red theme to chat interface
  - Use `#E54C3C` primary color
  - Gradient backgrounds matching dashboard
  - Shadow and rounded corners
- [x] 6.2 Style message bubbles
  - Publisher messages: right-aligned, red background
  - Bargainer messages: left-aligned, gray background
  - Rounded corners, max-width constraints
- [x] 6.3 Add loading and empty states
  - Loading spinner while session initializes
  - Empty state placeholder
  - Error state display

## 7. Error Handling & Edge Cases
- [x] 7.1 Handle expired access tokens
  - Implement token refresh logic in secondme-chat.ts
  - Return TOKEN_EXPIRED flag for client handling
- [x] 7.2 Handle API failures gracefully
  - Display user-friendly error messages
  - Allow retry on failed bargain attempts
- [ ] 7.3 Prevent concurrent bargains on same product
  - Check for existing active session
  - Redirect to existing session if found

## 8. Testing & Validation
- [ ] 8.1 Test bargain session creation flow
  - Click bargain button from dashboard
  - Verify session created in database
  - Verify redirect to chat page
- [ ] 8.2 Test SSE message streaming
  - Verify messages appear in real-time
  - Test reconnection after disconnect
- [ ] 8.3 Test session completion
  - Verify status updates to `completed`
  - Verify final price is stored
  - Verify UI shows completion state
- [ ] 8.4 Test error scenarios
  - Invalid session ID (404)
  - Expired token handling
  - API timeout handling

## 9. Documentation
- [ ] 9.1 Update `openspec/project.md` with new API endpoints
- [ ] 9.2 Add environment variable documentation (if needed)
- [ ] 9.3 Document SecondMe chat API usage

## Dependencies
- Task 2 (Backend API) depends on Task 1 (Database)
- Task 4 (Frontend) depends on Task 2 and Task 3 (Backend APIs)
- Task 5 (Product Card) can run in parallel with Task 4
- Task 6 (Styling) can run in parallel with Tasks 4-5
- Task 7 (Error handling) depends on Tasks 2-4
- Task 8 (Testing) depends on all previous tasks
- Task 9 (Documentation) is final, no dependencies

## Parallelizable Work
- Tasks 1, 2.1, 3.1, 4.2-4.4, 5.1, 6 can run in parallel
- Tasks 2.2-2.3, 3.2-3.3 depend on their respective service layers
