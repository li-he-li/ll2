'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BargainChat } from '@/components/BargainChat';

interface BargainSession {
  id: string;
  productId: string;
  publishPrice: number;
  currentPrice: number;
  targetPrice: number;
  status: string;
  finalPrice: number | null;
  publisherId: string;
  bargainerId: string;
}

export default function BargainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>('');
  const [session, setSession] = useState<BargainSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setSessionId(p.id));
  }, [params]);

  useEffect(() => {
    if (!sessionId) return;

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/bargain/${sessionId}`);

        if (!res.ok) {
          if (res.status === 404) {
            setError('砍价会话不存在');
          } else {
            setError('加载失败，请稍后再试');
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setSession(data.session);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching bargain session:', err);
        setError('网络错误，请检查连接');
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="text-center">
          <div className="text-primary text-xl font-bold animate-pulse mb-4">
            加载中...
          </div>
          <p className="text-text-secondary text-sm">正在获取砍价信息</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="bg-bg-card shadow-card max-w-md rounded-xl p-8 text-center">
          <span className="text-5xl mb-4">⚠️</span>
          <h3 className="text-text-primary text-xl font-bold mb-2">加载失败</h3>
          <p className="text-text-secondary mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-primary hover:bg-primary-light shadow-button border-primary rounded-full border-2 px-8 py-3 text-bg-card text-sm font-semibold transition-all"
          >
            返回主页
          </button>
        </div>
      </div>
    );
  }

  if (!sessionId) return null;

  return <BargainChat sessionId={sessionId} initialSession={session || undefined} />;
}
