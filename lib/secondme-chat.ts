/**
 * SecondMe Chat API Client
 *
 * Handles communication with SecondMe's chat API to enable AI-to-AI bargaining.
 */

const SECONDME_API_BASE = process.env.SECONDME_API_BASE || 'https://app.mindos.com/gate/lab';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  productName: string;
  publishPrice: number;
  targetPrice: number;
  role: 'bargainer' | 'publisher';
}

export interface ChatResponse {
  message: string;
  success: boolean;
  error?: string;
}

/**
 * Send a message to SecondMe chat API as an AI agent
 */
export async function sendChatMessage(
  accessToken: string,
  message: string,
  context?: ChatContext,
  conversationHistory?: ChatMessage[]
): Promise<ChatResponse> {
  try {
    // Build the system prompt based on the role
    let systemPrompt = '你是一个友好的AI助手。';

    if (context) {
      if (context.role === 'bargainer') {
        systemPrompt = `你是一个砍价专家。你正在帮助用户砍价购买${context.productName}。
- 商品原价：¥${context.publishPrice}
- 目标价格：¥${context.targetPrice}
- 你的任务是礼貌地与卖家协商，争取以更低的价格购买商品。
- 你应该理性、有礼貌地进行砍价，给出合理的理由。
- 每次报价时，明确说明你愿意支付的价格。`;
      } else if (context.role === 'publisher') {
        systemPrompt = `你是一个卖家。你的商品${context.productName}正在被砍价。
- 商品原价：¥${context.publishPrice}
- 买家想要以¥${context.targetPrice}购买
- 你的任务是维护价格，但也要表现出诚意。
- 如果买家的出价太低，礼貌地拒绝并说明理由。
- 如果可以接受的价格，可以表示"同意"或"成交"。`;
      }
    }

    // Build messages array
    const messages: ChatMessage[] = [
      { role: 'user', content: systemPrompt },
    ];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Add the current message
    messages.push({ role: 'user', content: message });

    // Call SecondMe chat API
    const response = await fetch(`${SECONDME_API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messages,
        model: 'secondme-chat',
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, needs refresh
        return {
          success: false,
          error: 'TOKEN_EXPIRED',
          message: '',
        };
      }
      throw new Error(`SecondMe API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      message: data.choices?.[0]?.message?.content || data.message || '',
    };
  } catch (error) {
    console.error('Error sending chat message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '',
    };
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  success: boolean;
  accessToken?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${SECONDME_API_BASE}/api/oauth/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Refresh token error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      accessToken: data.access_token,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Detect if a message indicates agreement/completion
 */
export function detectAgreement(message: string): boolean {
  const agreementPhrases = [
    '同意',
    '成交',
    '好的',
    '没问题',
    '就这样',
    '可以',
    '好的成交',
    'deal',
  ];

  const lowerMessage = message.toLowerCase();
  return agreementPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Extract price from message (e.g., "我愿意出5000元" -> 5000)
 */
export function extractPrice(message: string): number | null {
  const priceRegex = /(\d{3,5})\s*(元|块|￥|¥)/;
  const match = message.match(priceRegex);

  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  return null;
}
