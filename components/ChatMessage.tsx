import React from 'react';

interface ChatMessageProps {
  senderRole: 'publisher' | 'bargainer';
  content: string;
  timestamp: string;
  senderName?: string;
}

export function ChatMessage({ senderRole, content, timestamp, senderName }: ChatMessageProps) {
  const isPublisher = senderRole === 'publisher';
  const timeStr = new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isPublisher ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isPublisher ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
        {/* Avatar */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isPublisher ? 'bg-primary-bg' : 'bg-gray-200'
        }`}>
          <span className="text-sm">{isPublisher ? '🏪' : '🛒'}</span>
        </div>

        {/* Message bubble */}
        <div className={`flex flex-col ${isPublisher ? 'items-end' : 'items-start'}`}>
          {/* Sender name */}
          <span className="mb-1 text-xs text-text-secondary">
            {senderName || (isPublisher ? '卖家' : '买家')}
          </span>

          {/* Message content */}
          <div className={`rounded-2xl px-4 py-2 ${
            isPublisher
              ? 'bg-primary text-bg-card rounded-br-sm'
              : 'bg-gray-100 text-text-primary rounded-bl-sm'
          }`}>
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          </div>

          {/* Timestamp */}
          <span className="mt-1 text-xs text-text-light">{timeStr}</span>
        </div>
      </div>
    </div>
  );
}
