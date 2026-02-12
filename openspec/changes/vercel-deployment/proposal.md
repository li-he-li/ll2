# Change: Vercel Deployment Support

## Why

当前项目无法直接在Vercel部署，存在以下阻塞问题：

1. **数据库不兼容**：使用SQLite（file:./dev.db），Vercel的Serverless环境不支持
2. **图片存储不兼容**：上传到本地/public/uploads目录，Vercel生产环境是只读的
3. **环境变量未配置**：NEXTAUTH_URL等硬编码为localhost

这些问题导致项目无法在Vercel的生产环境中运行。

## What Changes

- **Database Migration**:
  - 从SQLite迁移到PostgreSQL（Vercel Postgres或其他Vercel支持的数据库）
  - 更新Prisma schema使用PostgreSQL适配器
  - 添加数据库连接池配置

- **Cloud Storage Integration**:
  - 图片上传从本地文件系统迁移到云存储服务
  - 选项A：使用Vercel Blob（推荐，Vercel原生支持）
  - 选项B：继续使用腾讯云COS（已有配置）
  - 更新图片上传API和服务层

- **Environment Configuration**:
  - 添加生产环境变量配置（.env.production）
  - 更新NEXTAUTH_URL为动态域名
  - 配置Vercel特定的环境变量

- **Build & Deployment**:
  - 添加vercel.json配置文件
  - 配置构建优化和输出
  - 添加部署脚本和文档

## Impact

- Affected specs: `database-migration` (new), `cloud-storage` (new), `environment-config` (new)
- Affected code:
  - `prisma/schema.prisma` - Update datasource provider and add connection pool
  - `package.json` - Add PostgreSQL adapter and Vercel dependencies
  - `lib/storage.ts` - New cloud storage service layer
  - `app/api/upload/route.ts` - New image upload API endpoint
  - `components/PublishForm.tsx` - Update to use cloud upload API
  - `.env.production` - Production environment variables
  - `vercel.json` - Vercel deployment configuration
  - `DEPLOYMENT.md` - Deployment documentation

## Dependencies

- Existing Prisma schema and migrations
- Existing SecondMe OAuth integration
- Existing product/bargain models
- Existing frontend components

## Alternatives Considered

### Database Options:
1. **Vercel Postgres** (推荐）- 完全托管，零配置
2. **Neon** - Serverless PostgreSQL，性能更好
3. **PlanetScale** - 需要额外配置
4. **Supabase** - 需要额外配置

### Storage Options:
1. **Vercel Blob** (推荐）- Vercel原生，简单集成
2. **腾讯云COS** - 已有配置，需要完善上传逻辑
3. **AWS S3** - 需要额外SDK和配置

## Migration Strategy

采用渐进式迁移策略：

**阶段1：数据库迁移**（1-2天）
- 安装PostgreSQL适配器
- 更新schema.prisma
- 运行本地数据库迁移
- 测试所有API endpoints

**阶段2：图片存储迁移**（2-3天）
- 集成云存储SDK
- 创建上传API endpoint
- 更新PublishForm组件
- 数据迁移：将现有图片上传到云存储

**阶段3：部署准备**（1天）
- 配置环境变量
- 添加vercel.json
- 创建部署文档
- 本地测试构建

**阶段4：Vercel部署**（1天）
- 连接Vercel账户
- 配置环境变量
- 首次部署
- 生产验证
