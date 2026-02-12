# Vercel 部署指南

本文档介绍如何将此项目部署到 Vercel 平台。

## 环境要求

- Node.js 18+ （推荐使用 LTS 版本）
- GitHub 账号（用于连接代码仓库）
- Vercel 账号（可使用 GitHub 账号登录）

## 环境变量配置

在部署前，需要在 Vercel Dashboard 中配置以下环境变量：

### 数据库配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | `postgresql://user:password@host:5432/dbname` |
| `DIRECT_URL` | Prisma Accelerate 直连 URL（含 pgbouncer） | `postgresql://user:password@host:5432/dbname?pgbouncer=true` |

**推荐使用 Vercel Postgres**：
1. 在 Vercel Dashboard 中进入项目
2. 点击 "Storage" → "Create Database" → "Postgres"
3. Vercel 会自动配置 `DATABASE_URL` 和 `DIRECT_URL`

### SecondMe OAuth 配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `SECONDME_APP_ID` | SecondMe 应用 ID | `e8516a71-0105-4ebe-875f-651652295e3a` |
| `SECONDME_APP_SECRET` | SecondMe 应用密钥 | `bc3d1511b926bf5db1fcc3cf29468a61fc99f81279169a6594c5c8dcfe85637b` |
| `SECONDME_OAUTH_ENDPOINT` | OAuth 授权端点 | `https://go.second.me/oauth/` |
| `SECONDME_API_ENDPOINT` | API 端点 | `https://app.mindos.com/gate/lab` |

### 应用配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NEXTAUTH_URL` | 生产环境域名 | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_SECONDME_APP_ID` | 公开的 SecondMe 应用 ID | `e8516a71-0105-4ebe-875f-651652295e3a` |

### 图片存储配置（可选）

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 存储令牌 | `vercel_blob_...` |

**设置 Vercel Blob**：
1. 在 Vercel Dashboard 中进入项目
2. 点击 "Storage" → "Create Database" → "Blob"
3. 创建后会自动生成 `BLOB_READ_WRITE_TOKEN`

## 部署步骤

### 方法 1：通过 Vercel Dashboard 部署

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New Project"
   - 从 GitHub 导入此项目
   - 选择包含 `package.json` 的根目录

3. **配置构建设置**
   - Framework Preset: `Next.js`
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **配置环境变量**
   - 在 "Environment Variables" 部分添加上述所有变量
   - **注意**：敏感变量不要添加 `NEXT_PUBLIC_` 前缀

5. **部署**
   - 点击 "Deploy"
   - 等待构建完成（约 2-3 分钟）

### 方法 2：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   vercel --prod
   ```

## 部署后操作

### 初始化数据库

部署完成后，需要初始化数据库结构：

1. 在 Vercel Dashboard 中打开项目
2. 进入 "Settings" → "Functions"
3. 查看构建日志，确认 Prisma Client 已生成

**注意**：如果使用 Vercel Postgres，首次访问应用时会自动创建数据库结构。

### 验证部署

1. **访问应用**
   - 打开 Vercel 提供的域名（如 `https://your-app.vercel.app`）
   - 检查页面是否正常加载

2. **测试登录**
   - 点击 "登录" 按钮
   - 使用 SecondMe OAuth 授权登录
   - 确认登录成功并跳转

3. **测试功能**
   - 发布商品并上传图片
   - 进入砍价大厅查看商品
   - 创建砍价会话

## 本地开发 vs 生产环境

### 本地开发（当前配置）

- 数据库：SQLite (`file:./dev.db`)
- 图片存储：本地文件系统 (`public/uploads/`)
- 环境变量：从 `.env` 加载

### 生产环境

- 数据库：Vercel Postgres (PostgreSQL)
- 图片存储：Vercel Blob（自动切换）
- 环境变量：从 Vercel Dashboard 配置加载

### 切换数据库

如需在本地测试 PostgreSQL：

1. 安装并启动 Docker Desktop
2. 运行 PostgreSQL 容器：
   ```bash
   docker run --name postgres-dev \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=dev \
     -p 5432:5432 \
     -d postgres:16
   ```
3. 修改 `.env` 中的 `DATABASE_URL`：
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/dev"
   ```
4. 运行数据库迁移：
   ```bash
   npx prisma db push
   ```

## 故障排除

### 构建失败

**错误**：`Cannot find module '@prisma/adapter-pg'`

**解决方案**：
```bash
npm install
```

### 数据库连接失败

**错误**：`Can't reach database server`

**解决方案**：
- 检查 `DATABASE_URL` 是否正确配置
- 如使用 Vercel Postgres，确认数据库已创建
- 检查 IP 白名单设置（Vercel Postgres 自动处理）

### OAuth 回调失败

**错误**：`OAuth callback failed` 或 `redirect_uri_mismatch`

**解决方案**：
- 确认 `NEXTAUTH_URL` 与生产域名一致
- 检查 SecondMe 应用配置中的回调 URL

### 图片上传失败

**错误**：`Failed to upload image`

**解决方案**：
- 确认 `BLOB_READ_WRITE_TOKEN` 已配置
- 检查 Vercel Blob 存储是否已创建
- 查看浏览器控制台和 Vercel 日志

## 成本估算

### Vercel 免费套餐

- **Hobby 计划**：免费
  - 100GB 带宽/月
  - 无限次部署
  - 自动 HTTPS
  - 边缘网络 CDN

### Vercel Postgres

- **Hobby 计划**：免费
  - 256 MB 存储
  - 60 小时计算时间/月
  - 1 亿行读取限制

### Vercel Blob

- **Hobby 计划**：免费
  - 500 GB 存储
  - 500 GB 带宽/月

**总成本**：使用免费套餐可完全免费运行，适合小型项目。

## 回滚程序

如果部署后出现严重问题：

1. **回滚到上一个版本**
   ```bash
   git revert HEAD
   git push
   ```

2. **或在 Vercel Dashboard 中**
   - 进入 "Deployments"
   - 找到之前的成功部署
   - 点击 "Promote to Production"

3. **数据库回滚**
   - Vercel Postgres 支持时间点恢复（PITR）
   - 在 Vercel Dashboard → Storage → Postgres → Backup 中操作

## 更多资源

- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment/vercel)
- [Vercel Postgres 文档](https://vercel.com/docs/storage/vercel-postgres)
