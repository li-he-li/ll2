'use client';

import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ProductBargainHeader } from './ProductBargainHeader';
import { useSSE, SSEMessage } from '@/hooks/useSSE';

interface BargainChatProps {
  sessionId: string;
  initialSession?: {
    productId: string;
    publishPrice: number;
    currentPrice: number;
    targetPrice: number;
    status: string;
    finalPrice: number | null;
  };
}

export function BargainChat({ sessionId, initialSession }: BargainChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, status, isConnected, isComplete, finalPrice, error } = useSSE(
    `/api/bargain/${sessionId}/stream`
  );

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bg-page">
        <div className="bg-bg-card shadow-card max-w-md rounded-xl p-8 text-center">
          <span className="text-5xl mb-4">⚠️</span>
          <h3 className="text-text-primary text-xl font-bold mb-2">连接错误</h3>
          <p className="text-text-secondary">{error}</p>
          <p className="text-text-light text-sm mt-4">
            请稍后再试或返回主页
          </p>
          <a
            href="/dashboard"
            className="bg-primary hover:bg-primary-light shadow-button border-primary mt-6 inline-block rounded-full border-2 px-8 py-3 text-bg-card text-sm font-semibold transition-all"
          >
            返回主页
          </a>
        </div>
      </div>
    );
  }

  if (!initialSession && !isComplete) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bg-page">
        <div className="text-primary text-xl font-bold animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Header with product info */}
      <div className="border-b-border-color sticky top-0 z-10 border-b bg-bg-card shadow-sm">
        <div className="mx-auto max-w-[1200px] px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-primary text-xl font-bold">💬 砍价对话</h1>
            <a
              href="/dashboard"
              className="text-text-secondary hover:text-primary text-sm transition-colors"
            >
              ← 返回大厅
            </a>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left sidebar - Product info */}
          <div className="lg:col-span-1">
            {initialSession && (
              <ProductBargainHeader
                productName={initialSession.productId}
                publishPrice={initialSession.publishPrice}
                currentPrice={initialSession.currentPrice}
                targetPrice={initialSession.targetPrice}
                status={status || initialSession.status}
                finalPrice={finalPrice}
              />
            )}
          </div>

          {/* Right main area - Chat messages */}
          <div className="lg:col-span-2">
            <div className="bg-bg-card shadow-card rounded-xl overflow-hidden">
              {/* Connection status */}
              <div className="border-b-border-color border-b px-4 py-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-text-secondary text-sm">
                    {isConnected ? '已连接' : '连接中...'}
                  </span>
                  {status && (
                    <span className="ml-4 text-text-light text-xs">
                      状态: {status}
                    </span>
                  )}
                </div>
              </div>

              {/* Messages list */}
              <div
                ref={messagesEndRef}
                className="bg-bg-page h-[500px] space-y-4 overflow-y-auto p-4"
              >
                {messages.length === 0 && !isComplete && (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl animate-bounce mb-2">💬</span>
                      <p className="text-text-secondary">
                        {isConnected
                          ? 'AI正在开始砍价对话...'
                          : '正在连接到砍价服务...'}
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={msg.data.id || idx}
                    senderRole={msg.data.senderRole || 'bargainer'}
                    content={msg.data.content || ''}
                    timestamp={msg.data.timestamp || new Date().toISOString()}
                    senderName={
                      msg.data.senderRole === 'publisher'
                        ? '卖家AI'
                        : '你的AI'
                    }
                  />
                ))}

                {isComplete && finalPrice && (
                  <div className="bg-green-50 border-green-200 mt-4 rounded-lg border-2 p-6 text-center">
                    <span className="text-4xl">🎉</span>
                    <h3 className="text-green-700 mt-2 text-lg font-bold">
                      砍价成功！
                    </h3>
                    <p className="text-green-600 text-3xl font-bold mt-2">
                      ¥{finalPrice}
                    </p>
                    <a
                      href="/dashboard"
                      className="bg-primary hover:bg-primary-light shadow-button border-primary mt-4 inline-block rounded-full border-2 px-8 py-3 text-bg-card text-sm font-semibold transition-all"
                    >
                      继续砍价
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
