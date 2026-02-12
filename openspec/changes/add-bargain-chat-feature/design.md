## Context

The bargaining feature is the core interaction of "one-more-slash" - a Pinduoduo-style AI-to-AI bargaining application. Users click "bargain" button on product cards, which launches a chat interface where their SecondMe AI avatar negotiates automatically with the product publisher's AI avatar.

**Constraints:**
- Must integrate with SecondMe Chat API (OAuth2 flow already implemented)
- Must maintain existing visual style (red #E54C3C, rounded cards, gradient backgrounds)
- Demo version - no real payment/transaction processing
- Chat should simulate bargaining negotiation (AI agents negotiate price down)

**Stakeholders:**
- End users: want to see AI bargaining on their behalf
- Product publishers: want their AI to defend pricing while negotiating
- System: needs to track bargain sessions and message history

## Goals / Non-Goals

**Goals:**
- Create seamless flow from product card to AI bargaining chat
- Enable autonomous AI-to-AI negotiation using SecondMe chat API
- Store bargain session history for replay/reference
- Match existing Pinduoduo visual design language

**Non-Goals:**
- Real payment processing (demo/mock only)
- Complex negotiation strategy algorithms (use SecondMe AI capabilities)
- Multi-party bargaining (1 publisher ↔ 1 bargainer per session)
- Webhook/push notifications (polling or Server-Sent Events acceptable)

## Decisions

### Decision 1: Chat Page Route Structure
**Choice:** `/bargain/[id]` where `id` is the bargain session ID

**Rationale:**
- Follows Next.js App Router conventions for dynamic routes
- Allows direct linking to specific bargain sessions
- Session ID can be shared/replayed
- Aligns with RESTful resource patterns

**Alternatives considered:**
- `/bargain?productId=123` - Query params less shareable, harder to implement middleware
- `/chat/[sessionId]` - "Bargain" is more domain-specific than generic "chat"

### Decision 2: AI Chat Integration Pattern
**Choice:** Server-side proxy to SecondMe Chat API with session management

**Rationale:**
- SecondMe requires OAuth access tokens (already stored per user)
- Server can authenticate both participants on behalf of users
- Message storage enables replay and audit trail
- Centralizes SecondMe API integration logic

**Alternatives considered:**
- Client-side direct to SecondMe - Would expose access tokens, can't authenticate publisher
- WebSocket proxy - More complex, SSE sufficient for demo scope

### Decision 3: Bargain Session State Model
**Choice:** Simple state machine: `created` → `negotiating` → `completed` | `failed`

**Rationale:**
- Clear progression matching real bargaining flows
- Easy to display status in UI
- Sufficient for demo (no complex escalation/arbitration)
- `failed` state handles API errors gracefully

**Data model:**
```
BargainSession {
  id, productId, publisherId, bargainerId,
  status, finalPrice, createdAt, completedAt
}

BargainMessage {
  id, sessionId, senderId, senderRole (publisher|bargainer),
  content, timestamp, isFromAI
}
```

### Decision 4: Chat Streaming Approach
**Choice:** Server-Sent Events (SSE) for real-time message streaming

**Rationale:**
- Unidirectional server-to-client fits chat use case
- Simpler than WebSocket for demo scope
- Native browser support, no additional libraries
- Automatic reconnection handling

**Alternatives considered:**
- Polling - Adds latency, server load
- WebSocket - Bidirectional overkill, more complex

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Product Card   │────▶│  Bargain Page   │────▶│   SSE Stream    │
│  (dashboard)    │     │  (/bargain/[id])│     │  /api/bargain/  │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                                │
                                                                ▼
                        ┌─────────────────────────────────────────────┐
                        │          Backend Services                  │
                        │  ┌─────────────┐      ┌────────────────┐  │
                        │  │   Bargain   │      │  SecondMe Chat │  │
                        │  │   Service   │─────▶│     API Proxy  │  │
                        │  └─────────────┘      └────────────────┘  │
                        └─────────────────────────────────────────────┘
                                        │
                                        ▼
                        ┌─────────────────────────────────────────────┐
                        │          Database (Prisma/SQLite)          │
                        │  ┌─────────────┐      ┌────────────────┐  │
                        │  │BargainSession│     │ BargainMessage │  │
                        │  └─────────────┘      └────────────────┘  │
                        └─────────────────────────────────────────────┘
```

## Component Structure

```
app/
├── bargain/
│   └── [id]/
│       └── page.tsx              # Bargain chat page
├── api/
│   └── bargain/
│       ├── route.ts              # POST create bargain session
│       ├── [id]/
│       │   ├── route.ts          # GET session details
│       │   └── stream/
│       │       └── route.ts      # SSE message streaming
│       └── complete/
│           └── route.ts          # POST finalize bargain
components/
├── ProductCard.tsx               # MODIFIED: Add onClick handler
├── BargainChat.tsx               # NEW: Chat message list
└── ChatMessage.tsx               # NEW: Single message display
lib/
├── secondme-chat.ts              # NEW: SecondMe chat API client
└── bargain-service.ts            # NEW: Bargain business logic
```

## Visual Design Reference

Based on [dashboard page](app/dashboard/page.tsx:1):
- Primary color: `#E54C3C` (Pinduoduo red)
- Background: Gradient `from-blue-50 to-indigo-100`
- Card style: White with shadow, rounded corners
- Buttons: Red gradient, rounded-full, hover scale effect
- Typography: Bold headings, clear hierarchy

Chat interface should include:
- Product info header (thumbnail, title, price progress)
- Message container (scrollable, distinct message bubbles)
- AI participant avatars (publisher vs bargainer)
- Status indicator (negotiating, completed)
- Final price summary (when complete)

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| SecondMe chat API rate limits | Implement exponential backoff, store messages locally |
| Long-running AI conversations | Set timeout (e.g., 5 min max), auto-complete |
| Token expiration during chat | Refresh token middleware on 401 errors |
| Concurrent bargain sessions | Lock at database level (one active session per user/product) |
| AI produces unexpected content | Content filtering, admin moderation tools (future) |

### Trade-offs

**Simplicity vs Realism:**
- Trade-off: Mock/demo bargaining vs realistic multi-turn AI negotiation
- Decision: Use SecondMe chat API for authenticity, but limit conversation turns for demo

**Real-time vs Polling:**
- Trade-off: SSE vs WebSocket complexity
- Decision: SSE sufficient for unidirectional chat streaming

## Migration Plan

**Phase 1 - Database Schema**
1. Add `BargainSession` and `BargainMessage` models to Prisma schema
2. Run migration: `npx prisma migrate dev --name add_bargain_tables`
3. Seed mock data for testing

**Phase 2 - Backend APIs**
1. Create bargain service layer
2. Implement session creation endpoint
3. Implement message streaming endpoint (SSE)
4. Add SecondMe chat integration

**Phase 3 - Frontend Components**
1. Create chat page and components
2. Update ProductCard with navigation
3. Implement SSE message consumption
4. Add loading/error states

**Phase 4 - Testing**
1. Unit tests for bargain service
2. Integration tests for API endpoints
3. E2E test for full bargaining flow

**Rollback Plan:**
- Database: Prisma rollback `migrate resolve --rolled-back [name]`
- Code: Git revert commit
- Frontend: Revert ProductCard changes, remove /bargain route

## Open Questions

1. **Conversation termination**: How many AI turns before auto-completing?
   - Suggestion: Default 10 exchanges, configurable via env var

2. **Price agreement logic**: How does the system detect "deal reached"?
   - Suggestion: Publisher AI responds "同意" or "成交", or max turns reached

3. **Multi-bargainer support**: Should multiple users bargain on same product?
   - Suggestion: Out of scope for v1, one-to-one only

4. **Historical replay**: Should completed bargains be viewable later?
   - Suggestion: Yes, read-only mode for history
