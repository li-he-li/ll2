import { prisma } from './prisma';

export type BargainStatus = 'negotiating' | 'completed' | 'failed';
export type SenderRole = 'publisher' | 'bargainer';

export interface CreateBargainInput {
  productId: string;
  publisherId: string;
  bargainerId: string;
  publishPrice: number;
  targetPrice: number;
}

export interface BargainMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderRole: SenderRole;
  content: string;
  timestamp: Date;
  isFromAI: boolean;
}

export interface BargainSession {
  id: string;
  productId: string;
  publisherId: string;
  bargainerId: string;
  publishPrice: number;
  currentPrice: number;
  targetPrice: number;
  status: BargainStatus;
  finalPrice: number | null;
  createdAt: Date;
  completedAt: Date | null;
  messages?: BargainMessage[];
}

/**
 * Create a new bargain session
 */
export async function createBargainSession(input: CreateBargainInput): Promise<BargainSession> {
  const session = await prisma.bargainSession.create({
    data: {
      productId: input.productId,
      publisherId: input.publisherId,
      bargainerId: input.bargainerId,
      publishPrice: input.publishPrice,
      currentPrice: input.publishPrice,
      targetPrice: input.targetPrice,
      status: 'negotiating',
    },
    include: {
      publisher: true,
      bargainer: true,
    },
  });

  return session as BargainSession;
}

/**
 * Get bargain session by ID
 */
export async function getBargainSession(sessionId: string): Promise<BargainSession | null> {
  const session = await prisma.bargainSession.findUnique({
    where: { id: sessionId },
    include: {
      publisher: true,
      bargainer: true,
      messages: {
        orderBy: { timestamp: 'asc' },
      },
    },
  });

  if (!session) {
    return null;
  }

  return session as BargainSession;
}

/**
 * Complete bargain session with final price
 */
export async function completeBargainSession(
  sessionId: string,
  finalPrice: number,
): Promise<BargainSession> {
  const session = await prisma.bargainSession.update({
    where: { id: sessionId },
    data: {
      status: 'completed',
      finalPrice,
      completedAt: new Date(),
    },
    include: {
      publisher: true,
      bargainer: true,
      messages: true,
    },
  });

  return session as BargainSession;
}

/**
 * Fail bargain session
 */
export async function failBargainSession(sessionId: string): Promise<BargainSession> {
  const session = await prisma.bargainSession.update({
    where: { id: sessionId },
    data: {
      status: 'failed',
      completedAt: new Date(),
    },
    include: {
      publisher: true,
      bargainer: true,
      messages: true,
    },
  });

  return session as BargainSession;
}

/**
 * Add a message to bargain session
 */
export async function addBargainMessage(
  sessionId: string,
  senderId: string,
  senderRole: SenderRole,
  content: string,
  isFromAI: boolean = true,
): Promise<BargainMessage> {
  const message = await prisma.bargainMessage.create({
    data: {
      sessionId,
      senderId,
      senderRole,
      content,
      isFromAI,
    },
  });

  return message as BargainMessage;
}

/**
 * Get messages for a bargain session
 */
export async function getBargainMessages(sessionId: string): Promise<BargainMessage[]> {
  const messages = await prisma.bargainMessage.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' },
  });

  return messages as BargainMessage[];
}

/**
 * Update current price in bargain session
 */
export async function updateBargainPrice(
  sessionId: string,
  currentPrice: number,
): Promise<BargainSession> {
  const session = await prisma.bargainSession.update({
    where: { id: sessionId },
    data: { currentPrice },
    include: {
      publisher: true,
      bargainer: true,
      messages: true,
    },
  });

  return session as BargainSession;
}
