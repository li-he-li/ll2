import { NextRequest } from 'next/server';
import { getBargainSession, addBargainMessage, completeBargainSession, failBargainSession } from '@/lib/bargain-service';
import { sendChatMessage, detectAgreement, extractPrice } from '@/lib/secondme-chat';
import { prisma } from '@/lib/prisma';

const MAX_EXCHANGES = parseInt(process.env.MAX_BARGAIN_EXCHANGES || '10', 10);
const EXCHANGE_DELAY = 2000; // 2 seconds between messages

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StreamMessage {
  type: 'message' | 'status' | 'error' | 'complete';
  data: {
    id?: string;
    senderId?: string;
    senderRole?: 'publisher' | 'bargainer';
    content?: string;
    timestamp?: string;
    status?: string;
    finalPrice?: number;
    error?: string;
  };
}

/**
 * SSE streaming endpoint for bargain chat
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  // Get the session
  const session = await getBargainSession(sessionId);

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create a readable stream for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (message: StreamMessage) => {
        const data = `data: ${JSON.stringify(message)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        // Get access tokens for both parties
        const bargainer = await prisma.user.findUnique({
          where: { secondmeId: session.bargainerId },
        });

        // For demo purposes, use a mock publisher if not found
        // In production, the publisher would be a real user
        let publisher = await prisma.user.findFirst({
          where: { secondmeId: session.publisherId },
        });

        // If publisher doesn't exist, create a mock one for demo
        if (!publisher) {
          publisher = await prisma.user.create({
            data: {
              secondmeId: 'mock-publisher-' + Date.now(),
              accessToken: 'mock-token',
              name: 'Mock Seller',
            },
          });
        }

        if (!bargainer) {
          sendEvent({
            type: 'error',
            data: { error: 'Bargainer not found' },
          });
          controller.close();
          return;
        }

        // Send initial status
        sendEvent({
          type: 'status',
          data: { status: 'negotiating' },
        });

        // Start AI conversation
        const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        let exchangeCount = 0;
        let isComplete = false;
        let currentPrice = session.currentPrice;

        // Initial bargainer message
        let bargainerMessage = `你好，我对这个${session.productId}很感兴趣，现在价格是¥${session.publishPrice}，能不能便宜点？我希望能以¥${session.targetPrice}购买。`;

        while (exchangeCount < MAX_EXCHANGES && !isComplete) {
          // Bargainer sends message
          const bargainerResponse = await sendChatMessage(
            bargainer.accessToken,
            bargainerMessage,
            {
              productName: session.productId,
              publishPrice: session.publishPrice,
              targetPrice: session.targetPrice,
              role: 'bargainer',
            },
            [...conversationHistory]
          );

          if (!bargainerResponse.success) {
            sendEvent({
              type: 'error',
              data: { error: 'Failed to get bargainer response' },
            });
            await failBargainSession(sessionId);
            controller.close();
            return;
          }

          // Store and send bargainer message
          const bargainerMsg = await addBargainMessage(
            sessionId,
            session.bargainerId,
            'bargainer',
            bargainerResponse.message,
            true
          );

          sendEvent({
            type: 'message',
            data: {
              id: bargainerMsg.id,
              senderId: bargainerMsg.senderId,
              senderRole: 'bargainer',
              content: bargainerMsg.content,
              timestamp: bargainerMsg.timestamp.toISOString(),
            },
          });

          // Extract price if mentioned
          const bargainerPrice = extractPrice(bargainerResponse.message);
          if (bargainerPrice && bargainerPrice < currentPrice) {
            currentPrice = bargainerPrice;
          }

          conversationHistory.push({
            role: 'assistant',
            content: bargainerResponse.message,
          });

          exchangeCount++;

          // Delay before publisher responds
          await new Promise(resolve => setTimeout(resolve, EXCHANGE_DELAY));

          // Publisher responds
          const publisherMessage = `买家说：${bargainerResponse.message}`;
          const publisherResponse = await sendChatMessage(
            publisher.accessToken,
            publisherMessage,
            {
              productName: session.productId,
              publishPrice: session.publishPrice,
              targetPrice: session.targetPrice,
              role: 'publisher',
            },
            [...conversationHistory]
          );

          if (!publisherResponse.success) {
            sendEvent({
              type: 'error',
              data: { error: 'Failed to get publisher response' },
            });
            await failBargainSession(sessionId);
            controller.close();
            return;
          }

          // Store and send publisher message
          const publisherMsg = await addBargainMessage(
            sessionId,
            session.publisherId,
            'publisher',
            publisherResponse.message,
            true
          );

          sendEvent({
            type: 'message',
            data: {
              id: publisherMsg.id,
              senderId: publisherMsg.senderId,
              senderRole: 'publisher',
              content: publisherMsg.content,
              timestamp: publisherMsg.timestamp.toISOString(),
            },
          });

          // Check for agreement
          if (detectAgreement(publisherResponse.message)) {
            isComplete = true;

            // Extract final price
            const finalPrice = extractPrice(publisherResponse.message) || currentPrice;

            // Complete the session
            await completeBargainSession(sessionId, finalPrice);

            sendEvent({
              type: 'complete',
              data: {
                status: 'completed',
                finalPrice,
              },
            });

            controller.close();
            return;
          }

          conversationHistory.push({
            role: 'assistant',
            content: publisherResponse.message,
          });

          // Prepare next bargainer message based on publisher response
          bargainerMessage = `卖家说：${publisherResponse.message}`;
          if (currentPrice < session.targetPrice) {
            bargainerMessage += ` 现在能接受¥${currentPrice}吗？`;
          }

          // Delay before next exchange
          await new Promise(resolve => setTimeout(resolve, EXCHANGE_DELAY));
        }

        // Max exchanges reached
        if (!isComplete) {
          await completeBargainSession(sessionId, currentPrice);
          sendEvent({
            type: 'complete',
            data: {
              status: 'completed',
              finalPrice: currentPrice,
            },
          });
        }

        controller.close();
      } catch (error) {
        console.error('Error in bargain stream:', error);
        sendEvent({
          type: 'error',
          data: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
        await failBargainSession(sessionId);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
