"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // 检查是否已登录
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            router.push("/dashboard");
          }
        }
      } catch (error) {
        // 未登录，显示登录页面
      }
    };
    checkAuth();
  }, [router]);

  const handleLogin = () => {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.NEXT_PUBLIC_SECONDME_APP_ID || "e8516a71-0105-4ebe-875f-651652295e3a",
      redirect_uri: `${window.location.origin}/api/auth/callback`,
      scope: "user.info",
    });
    window.location.href = `https://go.second.me/oauth/?${params.toString()}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">SecondMe 应用</h1>
        <p className="text-gray-600 mb-8">集成 SecondMe API 的智能应用</p>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">功能特性</h3>
            <ul className="text-sm text-blue-700 text-left space-y-1">
              <li>✓ 用户认证 (OAuth2)</li>
              <li>✓ AI 智能对话</li>
              <li>✓ 兴趣标签系统</li>
              <li>✓ 软记忆功能</li>
            </ul>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            使用 SecondMe 登录
          </button>
        </div>
      </div>
    </div>
  );
}
