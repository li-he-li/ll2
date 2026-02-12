# Change: Add Bargain Chat Feature

## Why

Users currently can view product cards in the bargaining hall but cannot engage in the actual bargaining process. The core value proposition of "one-more-slash" is AI-to-AI automated bargaining where SecondMe AI avatars negotiate on behalf of users. This change enables the primary user interaction flow: clicking "bargain" triggers an AI chat negotiation between the product publisher's AI and the bargainer's AI.

## What Changes

- **Frontend:**
  - Add bargain chat page (`/bargain/[id]`) displaying AI conversation
  - Update ProductCard "bargain button" to navigate to chat page
  - Style chat interface to match existing Pinduoduo-red theme (#E54C3C)

- **Backend:**
  - Add API endpoint for bargain session creation
  - Add API endpoint for chat messages streaming
  - Integrate with SecondMe chat API for AI-to-AI dialogue
  - Store bargain sessions and message history

- **Data Model:**
  - BargainSession table (product, participants, status)
  - BargainMessage table (sender, content, timestamp)

## Impact

- Affected specs: `bargaining`, `ai-chat` (new capabilities)
- Affected code:
  - `components/ProductCard.tsx` - Add navigation handler
  - `app/bargain/[id]/page.tsx` - New chat page
  - `app/api/bargain/*` - New API routes
  - `prisma/schema.prisma` - New database models
