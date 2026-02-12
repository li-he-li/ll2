# Design: Vercel Deployment Support

## Overview

这个设计将项目从本地开发环境迁移到Vercel生产环境，主要解决数据库兼容性和图片持久化存储问题。

## Architecture Changes

### Current State
```
[Local Development]
├── SQLite Database (file:./dev.db)
├── Local File Upload (/public/uploads)
├── Hardcoded Environment Variables (localhost:3000)
└── Next.js App Router

[Vercel Production - TARGET]
├── PostgreSQL Database (Vercel Postgres)
├── Cloud Storage (Vercel Blob or COS)
├── Dynamic Environment Variables
└── Next.js App Router
```

### Component Architecture

**Database Layer**:
```
Before: prisma/sqlite
After:  prisma/postgresql + @prisma/adapter-postgresql

lib/
├── prisma.ts (singleton client)
├── storage.ts (new: cloud storage abstraction)
└── db-migrate.ts (new: migration utilities)
```

**Storage Layer**:
```
Before: Write to /public/uploads
After: Upload to cloud storage via API

app/api/
├── upload/route.ts (new: handle image uploads)
└── [Existing routes continue to work]

lib/storage.ts (new):
├── uploadImage(file: File): Promise<string>
├── deleteImage(url: string): Promise<void>
└── getImageUrl(url: string): string
```

## Database Migration Design

### Schema Changes

**Before** (prisma/schema.prisma):
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**After** (prisma/schema.prisma):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_DIRECT") // For Prisma Accelerate
}

generator client {
  provider = "prisma-client-js"
}
```

### Migration Strategy

**Option A：使用Vercel Postgres（推荐）**
- Vercel自动创建和管理数据库
- 零配置，开箱即用
- 内置连接池和优化
- 自动备份和高可用

**Option B：使用外部PostgreSQL**
- Neon、Supabase、AWS RDS等
- 需要手动配置连接字符串
- 可能需要额外付费

### Migration Process

1. **导出现有数据**：
```bash
# SQLite dump to SQL
npx prisma db pull  # 如果使用Prisma Cloud
# 或手动导出
sqlite3 dev.db .dump/data.sql
```

2. **更新依赖和schema**：
```bash
npm install @prisma/adapter-postgresql
# Update prisma/schema.prisma provider
npx prisma generate
```

3. **推送到新数据库**：
```bash
# 设置PostgreSQL DATABASE_URL
# 创建schema
npx prisma db push
# （数据需要手动迁移或使用Prisma Migrate）
```

4. **验证迁移**：
```bash
# 检查数据完整性
npx prisma studio
# 测试API endpoints
npm run test
```

## Cloud Storage Design

### Option A：Vercel Blob（推荐）

**Architecture**:
```
Upload Flow:
1. Frontend selects image
2. POST /api/upload with FormData
3. Server validates and uploads to Vercel Blob
4. Returns public URL
5. Product saved with cloud URL

API Response:
{
  "url": "https://[blob-store].vercel-storage.com/[filename]",
  "filename": "image-1234567890.jpg",
  "size": 123456,
  "uploadedAt": "2025-01-15T10:30:00Z"
}
```

**Implementation**:
```typescript
// app/api/upload/route.ts
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const blob = await put(file.name, file, {
    access: 'public',
  });

  return NextResponse.json({
    url: blob.url,
    filename: file.name,
    size: file.size,
  });
});
```

**Advantages**:
- Vercel原生支持
- 全球CDN分发
- 自动HTTPS
- 按使用量计费（慷慨的免费额度）
- 零配置

### Option B：腾讯云COS（备选）

如果继续使用COS（已有配置）：

```typescript
// lib/storage.ts (COS implementation)
import COS from 'cos-nodejs-sdk-v5';

export async function uploadImage(file: File): Promise<string> {
  const cos = new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
  });

  // Upload logic
  const result = await cos.putObject({
    Bucket: process.env.COS_BUCKET,
    Region: process.env.COS_REGION,
    Key: `products/${Date.now()}-${file.name}`,
    Body: file,
  });

  return result.Location;
}
```

**Advantages**:
- 已有配置和经验
- 国内访问速度快
- 可能已有付费账户

## Environment Configuration

### Development Environment (.env）
```env
# Local Development
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
SECONDME_APP_ID="..."
SECONDME_APP_SECRET="..."
```

### Production Environment (.env.production）
```env
# Vercel Production
DATABASE_URL="postgresql://user:pass@host:5432/db"
NEXTAUTH_URL="https://your-app.vercel.app"
SECONDME_APP_ID="..."
SECONDME_APP_SECRET="..."

# Optional: Prisma Accelerate (improves query performance)
DATABASE_URL_DIRECT="postgresql://user:pass@host:5432/db?pgbouncer=true"

# Vercel Blob (if using Vercel storage)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Or COS credentials (if using COS)
COS_SECRET_ID="..."
COS_SECRET_KEY="..."
COS_BUCKET="..."
COS_REGION="ap-guangzhou"
```

### Vercel Environment Variables

在Vercel Dashboard中配置：

```bash
# Settings → Environment Variables

# Database
DATABASE_URL=postgresql://...

# SecondMe OAuth
SECONDME_APP_ID=...
SECONDME_APP_SECRET=...
SECONDME_OAUTH_ENDPOINT=https://go.second.me/oauth/
SECONDME_API_ENDPOINT=https://app.mindos.com/gate/lab

# App Configuration
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_SeCONDME_APP_ID=...

# Optional: Blob Storage
BLOB_READ_WRITE_TOKEN=...
```

## Deployment Configuration

### vercel.json

```json
{
  "buildCommand": "prisma generate && next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "ignoreCommand": "rm -rf node_modules",
  "env": {
    "DATABASE_URL": "@database-url",
    "NEXTAUTH_URL": "@nextauth-url"
  },
  "regions": ["hkg1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

### Build Optimizations

```json
// next.config.ts (additions for production)
module.exports = {
  // ... existing config

  // Production optimizations
  output: 'standalone',

  // Image optimization for cloud storage
  images: {
    domains: [
      'your-app.vercel.app',
      'public.blob.vercel-storage.com',
      'mindverseglobal-cos-cdn.mindverse.com'
    ],
    unoptimized: false,
  },

  // Compression
  compress: true,

  // Headers
  headers: async () => {
    return [
      {
        source: '/:path',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};
```

## Rollback Strategy

如果部署失败需要回滚：

**Database**：
```bash
# PostgreSQL → SQLite
DATABASE_URL="file:./dev.db"
npm install @prisma/sqlite
npx prisma generate
npx prisma db push
```

**Storage**：
```typescript
// Cloud → Local (code changes)
// 在PublishForm.tsx中切换upload逻辑
const USE_CLOUD_STORAGE = process.env.NODE_ENV === 'production';

if (USE_CLOUD_STORAGE) {
  // Use cloud upload API
} else {
  // Use local upload (existing code)
}
```

## Testing Strategy

### Pre-deployment Testing

**本地测试**：
```bash
# 1. 使用Docker启动PostgreSQL
docker run --name postgres -e POSTGRES_PASSWORD=password postgres

# 2. 配置.env使用PostgreSQL
DATABASE_URL="postgresql://localhost:5432/dev"

# 3. 运行迁移
npx prisma db push

# 4. 测试所有功能
npm run dev
```

### Production Testing Checklist

- [ ] 数据库连接正常
- [ ] SecondMe OAuth回调工作
- [ ] 图片上传功能正常
- [ ] 产品CRUD操作正常
- [ ] 砍价会话创建正常
- [ ] 登出登录功能正常
- [ ] 所有API endpoints响应正常
- [ ] 前端路由和组件加载正常

## Monitoring and Logging

**Database Connection Pooling**:
```typescript
// lib/prisma.ts (improved)
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

if (!globalForPrisma.prisma) {
  const connectionString = process.env.DATABASE_URL;

  if (process.env.NODE_ENV === 'production') {
    // Production: Prisma Accelerate
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: connectionString,
        },
      },
    });
  } else {
    // Development: Standard client
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: connectionString,
        },
      },
    });
  }
}
}

export default globalForPrisma.prisma;
```

**Error Tracking**:
```typescript
// app/api/[route]/error.ts (new error handler)
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const error = await fetch('https://api.vercel.com/v1/...');

  return NextResponse.json({
    error: 'Something went wrong',
    requestId: crypto.randomUUID(),
  });
}
```

## Performance Optimizations

**Database Query Optimization**:
```typescript
// 使用select减少数据传输
const products = await prisma.product.findMany({
  select: {
    id: true,
    title: true,
    imageUrl: true,
    publishPrice: true,
    // Only select needed fields
  },
  where: { status: 'active' },
  take: 50, // Pagination
});
```

**Image Optimization**:
- 使用next/image组件优化
- 配置合适的图片尺寸（1200x630, 800x530等）
- 启用lazy loading
- 使用priority hint

## Cost Analysis

### Vercel Pricing (Hobby Plan - Free）
- **Bandwidth**: 100GB/month
- **Executions**: 100小时/month
- **Serverless Function Executions**: 100GB-hours/month
- **Blob Storage**: 1GB total, 500MB per blob

**估算月度成本**（中等流量）:
- 数据库：免费（Vercel Postgres Hobby Plan）
- 图片存储：$5-10/月（取决于存储量）
- 计算：$20-30/月（Hobby Plan足够）

### Backup Strategy

**数据库备份**：
```bash
# 定期备份到本地
npx prisma db pull --schema=./prisma/schema.prisma

# 或使用Prisma Cloud的备份功能
# Prisma Cloud自动备份每天的数据
```

**代码备份**：
- Git仓库托管在GitHub
- Vercel自动部署main分支
- 建议使用feature branches开发

## Security Considerations

**数据库安全**：
```env
# Vercel自动管理敏感信息
# 不要在代码中硬编码数据库连接字符串
# 使用环境变量
```

**API密钥**：
```env
# SecondMe密钥存储在Vercel环境变量
# 从不提交到Git仓库
# .env.production已在.gitignore中
```

**CORS配置**：
```json
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

## Known Limitations

**Vercel Serverless Constraints**：
- 执行时间限制：10秒（Hobby），60秒（Pro）
- 请求体大小限制：4.5MB
- 响应大小限制：4.5MB
- 不支持WebSocket（需要使用SSE替代）

**Mitigation**：
- 大文件上传使用分块上传
- 长时间查询使用数据库索引
- 实时砍价使用SSE（已有实现）

## Migration Timeline Estimate

**阶段1：准备**（1-2天）
- 安装依赖，更新配置
- 本地测试PostgreSQL集成
- 设置云存储账户

**阶段2：实施**（3-5天）
- 实现图片上传API
- 更新前端组件
- 迁移图片数据
- 环境变量配置

**阶段3：部署**（1天）
- 配置Vercel项目
- 首次部署和测试
- 生产验证
- 监控设置

**总计：5-8天**完成全部迁移
