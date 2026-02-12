# Agent 开发指南

本文档记录了项目开发过程中 agent 的使用方式、经验和最佳实践，帮助未来开发避免重复造轮子。

---

## 项目中已使用的主要技能

### 1. SecondMe 集成技能

**技能来源**: `secondme-reference` (用户安装)

**用途**: SecondMe API 的完整技术参考，包含 OAuth2、API 调用等

**关键信息**:
- OAuth2 授权 URL: `https://go.second.me/oauth/`
- API 基础 URL: `https://app.mindos.com/gate/lab`
- Token 有效期: Access Token 2小时, Refresh Token 30天
- API 响应格式: `{ code: 0, data: { ... } }`

**使用场景**:
- 实现 OAuth2 登录流程
- 调用 SecondMe 用户信息、聊天、笔记等 API
- 处理 token 刷新逻辑

**重要提醒**:
- 所有响应需提取 `data` 字段
- Token 字段使用 camelCase (`accessToken` 不是 `access_token`)
- 用户 ID 字段名为 `userId`
- Token 交换需要 `application/x-www-form-urlencoded` 格式

---

### 2. UI/UX 设计技能

**技能来源**: `ui-ux-pro-max` (用户安装)

**用途**: UI/UX 设计指南，包含 67 种风格、96 种配色方案、57 种字体组合

**关键功能**:
- 生成设计系统（`--design-system`）
- 支持多种技术栈（React, Next.js, Vue, Tailwind 等）
- 提供可访问性、性能、布局等最佳实践

**使用命令示例**:
```bash
# 生成设计系统
python3 skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service" --design-system -p "Project Name"

# 持久化设计系统
python3 skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name"

# 领域搜索
python3 skills/ui-ux-pro-max/scripts/search.py "glassmorphism" --domain style
```

**设计清单**:
- ✓ 不使用 emoji 图标（使用 SVG）
- ✓ 所有可点击元素有 `cursor-pointer`
- ✓ 悬停状态提供视觉反馈
- ✓ 检查亮/暗模式对比度

---

## Agent 使用模式

### 模式 1: 并行探索（Context Gathering）

在 analyze-mode 下，使用多个并行的 explore agents 收集信息：

```typescript
// 并行启动探索任务
task(subagent_type="explore", run_in_background=true, load_skills=[],
  description="Find API routes", prompt="...")

task(subagent_type="explore", run_in_background=true, load_skills=[],
  description="Find components", prompt="...")

// 继续其他工作...
// 稍后收集结果
background_output(task_id="bg_xxx")
```

**何时使用**:
- 需要理解现有代码库结构
- 多个搜索角度（API、组件、配置等）
- 分析任务开始前收集上下文

---

### 模式 2: 委托专业任务（Delegation）

根据任务类别选择合适的 agent + skill：

```typescript
// 前端 UI/UX 任务
task(category="visual-engineering",
  load_skills=["frontend-design", "ui-ux-pro-max"],
  prompt="...")

// 快速修复
task(category="quick",
  load_skills=[],
  prompt="...")

// 复杂架构问题
task(category="ultrabrain",
  load_skills=[],
  prompt="...")
```

**选择优先级**:
1. 用户安装的技能 > 内置技能
2. 检查所有技能描述，判断是否相关
3. 不相关时必须提供理由

---

### 模式 3: 会话继续（Session Continuity）

使用 `session_id` 继续之前的对话：

```typescript
// 首次调用
const result = task(...);
const sessionId = result.session_id;

// 后续调用
task(session_id="ses_...", prompt="Fix: specific error");
```

**何时使用**:
- 任务失败需要修复
- 需要基于之前的结果继续
- 多轮对话的同一主题

---

## 项目架构经验

### 技术栈选择

- **框架**: Next.js 15.1.3 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: Prisma + SQLite
- **认证**: 自定义 OAuth2（未使用 NextAuth）

### 认证流程设计

项目中采用了自定义 OAuth2 流程而非 NextAuth：

**原因**:
- 需要完全控制 token 处理逻辑
- 更灵活的会话管理
- 直接存储 SecondMe access_token 到数据库

**流程**:
1. 前端跳转到 `https://go.second.me/oauth/`
2. 用户授权后回调到 `/api/auth/callback/secondme`
3. 后端用 code 换取 access_token
4. 保存用户信息 + tokens 到数据库
5. 设置 HTTP-only cookie 存储会话

**关键文件**:
- `lib/secondme.ts` - SecondMe API 交互
- `app/api/auth/callback/secondme/route.ts` - OAuth 回调处理

---

## 常见问题与解决方案

### 问题 1: API 响应格式

**问题**: 直接使用响应导致 `.map is not a function`

**原因**: SecondMe API 返回 `{ code: 0, data: {...} }` 格式

**解决**:
```typescript
// ❌ 错误
const shades = await response.json();
shades.map(...)

// ✅ 正确
const result = await response.json();
if (result.code === 0) {
  const shades = result.data.shades;
  shades.map(...)
}
```

---

### 问题 2: Token 字段命名

**问题**: Token 交换失败，字段名不匹配

**原因**: SecondMe 使用 camelCase，其他 OAuth 提供商可能用 snake_case

**解决**:
```typescript
// SecondMe 返回:
{
  "code": 0,
  "data": {
    "accessToken": "lba_at_...",  // 不是 access_token
    "refreshToken": "lba_rt_...",  // 不是 refresh_token
    "expiresIn": 7200
  }
}
```

---

### 问题 3: Content-Type 格式

**问题**: Token 交换 API 返回 400 错误

**原因**: 必须使用 `application/x-www-form-urlencoded` 格式

**解决**:
```typescript
// 正确的请求格式
await fetch("https://app.mindos.com/gate/lab/api/oauth/token/code", {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: buildFormBody({...})  // x-www-form-urlencoded 格式
});
```

---

### 问题 4: Session 管理

**问题**: 登录状态不一致

**解决**:
- 使用 HTTP-only cookie
- 设置 `sameSite: "lax"` 防止 CSRF
- 前端自动检查登录状态并重定向

---

## 开发工作流

### 新功能开发流程

1. **需求分析**
   - 理解用户需求
   - 检查是否已有类似实现
   - 确定技术方案

2. **上下文收集** (analyze-mode)
   ```typescript
   // 并行启动 explore agents
   task(subagent_type="explore", ...)
   task(subagent_type="librarian", ...)  // 如果涉及外部库
   ```

3. **设计决策**
   - 复用现有模式（如果代码库是规范的）
   - 或提出新方案（如果需要改进）

4. **实现**
   - 如果任务复杂，创建 TODO 列表
   - 标记 in_progress → completed
   - 运行验证

5. **验证**
   - LSP 诊断检查
   - 运行构建/测试（如果有）
   - 取消后台任务

---

## Todo 管理

**何时创建 TODO**:
- 多步骤任务（2+ 步骤）
- 不确定范围
- 用户请求多个项目

**工作流程**:
1. 收到请求 → 立即创建 TODO
2. 开始步骤前 → 标记 `in_progress`
3. 完成步骤后 → 立即标记 `completed`（不批量）
4. 完成所有 → 取消后台任务

---

## 工具选择指南

| 工具 | 用途 | 何时使用 |
|------|------|---------|
| `read` | 读取文件 | 需要查看特定文件内容 |
| `grep` | 内容搜索 | 简单关键词搜索 |
| `ast_grep_search` | 代码模式搜索 | 查找特定代码模式（如 useState） |
| `glob` | 文件匹配 | 查找文件名模式 |
| `lsp_diagnostics` | 错误诊断 | 验证代码质量 |
| `lsp_goto_definition` | 跳转定义 | 查找符号定义 |
| `lsp_find_references` | 查找引用 | 查找符号所有使用位置 |
| `bash` | 执行命令 | 终端操作（git, npm, 等） |
| `task` | 委托 agent | 复杂任务需要专业处理 |

**优先使用直接工具**（read, grep, glob）的场景：
- 简单的文件操作
- 明确知道要搜索什么
- 单文件读取

**优先使用 agent** 的场景：
- 需要多角度搜索
- 不熟悉模块结构
- 跨层模式发现
- 外部库/文档查找

---

## 避免重复造轮子

### 检查清单

开始新功能前，检查以下内容：

1. **代码库中是否有类似实现？**
   - 使用 `grep` 或 `ast_grep_search` 查找
   - 查看 `docs/功能文档.md`

2. **是否有合适的 agent 技能？**
   - `ui-ux-pro-max` - UI/UX 设计
   - `secondme-reference` - SecondMe API
   - `frontend-design` - 前端设计
   - `playwright` - 浏览器测试

3. **是否有官方文档或示例？**
   - 使用 `librarian` agent 搜索外部资源
   - 查看官方文档链接

4. **项目模式是否规范？**
   - 查看 `package.json`, `.eslintrc.json`, `tsconfig.json`
   - 采样 2-3 个类似文件检查一致性

---

## Git 提交规范

**创建提交前**:
```bash
# 并行检查状态
git status
git diff
git log -5 --oneline
```

**提交信息格式**:
```
<type>: <简短描述>

<详细说明（可选）>

- 第一行: 类型 + 简短描述（50字内）
- 类型: feat, fix, refactor, docs, style, test, chore
- 不添加 emoji（除非用户明确要求）
```

---

## 联系与支持

- **SecondMe 官方文档**: https://develop-docs.second.me/zh/docs
- **Next.js 文档**: https://nextjs.org/docs
- **Prisma 文档**: https://www.prisma.io/docs
