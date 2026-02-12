# Project Context

## Purpose
**one-more-slash** (再砍一AI) 是一个纯 A2A (AI-to-AI) 砍价应用，让用户的 SecondMe AI 分身 24/7 进"砍价大厅"，与其他买家 AI 一起喊口号、组团砍价、集体压商家 AI 的价格。模拟经典拼多多砍价场景的全面 AI 自动化版本。

## Tech Stack
- **Framework**: Next.js 15.1.3 (App Router)
- **Frontend**: React 19, TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM 6.0
- **Authentication**: SecondMe OAuth2
- **State Management**: React hooks, cookies for session
- **Language**: TypeScript (strict mode)

## Project Conventions

### Code Style
- **命名约定**:
  - 文件命名: kebab-case (e.g., `secondme.ts`, `route.ts`)
  - 组件命名: PascalCase (e.g., `ProductCard`)
  - 变量/函数: camelCase
- **TypeScript**: 严格模式，所有函数参数和返回值必须有类型
- **Import 顺序**: 1) 标准库 2) 第三方库 3) 本地模块 (使用 `@/` 别名)
- **API 路由**: 使用 `app/api/` 目录，返回 `NextResponse`

### Architecture Patterns
- **App Router**: 使用 Next.js 13+ App Router 架构
- **路由组织**:
  - `app/` - 页面组件
  - `app/api/` - API 路由
  - `lib/` - 共享工具函数
  - `components/` - 可复用组件
- **数据库访问**: 通过 `lib/prisma.ts` 导出的单例 Prisma Client
- **认证流程**:
  1. 前端重定向到 `https://go.second.me/oauth/`
  2. 回调到 `/api/auth/callback`
  3. 后端交换 code 换取 access_token
  4. 存储 session cookie 并重定向到 dashboard

### Testing Strategy
- 当前无测试（黑客松 Demo 版）
- 建议添加: Vitest for 单元测试, Playwright for E2E 测试

### Git Workflow
- **主分支**: `main`
- **提交规范**: 简洁描述变更内容
- **分支策略**: 功能分支从 main 创建，完成后 PR 合并

## Domain Context

### SecondMe OAuth 流程
1. **授权 URL**: `https://go.second.me/oauth/`
2. **Token 端点**: `https://app.mindos.com/gate/lab/api/oauth/token/code`
3. **用户信息端点**: `https://app.mindos.com/gate/lab/api/secondme/user/info`
4. **Redirect URI**: `http://localhost:3000/api/auth/callback`
5. **Token 有效期**: Access Token 2小时，Refresh Token 30天

### 砍价大厅概念
- **2×4 网格布局**: 显示 8 个商品卡片
- **商品卡片**包含: 图片、标题、砍价进度条、价格信息、用户信息、剩余时间、"帮他砍一刀"按钮
- **拼多多风格配色**: 主红色 `#E54C3C`

### 数据模型
- **User 表**: 存储 SecondMe 用户信息 (secondmeId, accessToken, refreshToken, name, email, image)

## Important Constraints
- **Demo 限制**: 黑客松版本，功能为虚拟模拟成交
- **SecondMe 依赖**: 必须依赖 SecondMe OAuth 认证
- **环境变量**: `.env` 和 `.secondme/` 已加入 `.gitignore`（保护敏感信息）

## External Dependencies
- **SecondMe API**:
  - OAuth 认证: `https://go.second.me/oauth/`
  - API 基础 URL: `https://app.mindos.com/gate/lab`
  - 文档: https://develop-docs.second.me/zh/docs
- **NPM 包**: 见 `package.json`

## API 端点清单
| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/auth/callback` | GET | OAuth 回调处理 |
| `/api/auth/logout` | GET | 登出 |
| `/api/auth/me` | GET | 获取当前用户信息 |
| `/api/auth/[...nextauth]` | - | NextAuth 配置（保留） |
| `/api/bargain` | POST | 创建砍价会话 |
| `/api/bargain/[id]` | GET | 获取砍价会话详情 |
| `/api/bargain/[id]/stream` | GET | SSE 流式砍价消息 |

## 已实现功能
1. 连接后端 API ✅
2. 添加数据加载状态 ✅
3. 实现搜索功能 ✅
4. 添加筛选和排序 ✅
5. 实现分页加载 ✅
6. 添加用户认证 ✅
7. 实现砍价交互功能 ✅

## 待实现功能 (未来优化)
1. 添加商品发布功能
2. 实现我的砍价页面
3. 添加砍价历史记录查看
4. 实现真实SecondMe API调用（当前为Demo模拟）
5. 添加用户间消息通知
