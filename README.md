# 🔍 Illuminateur - Personal Insight Collector

一个基于 Cloudflare 技术栈构建的个人信息捕获和分析工具，能够处理文本、URL 和图片，使用大语言模型进行智能分析，并生成每周洞察报告。

## 🏗️ 系统架构

### 技术栈
- **计算**: Cloudflare Workers (前端服务 + 后端 API)
- **对象存储**: Cloudflare R2 (存储原始文件)
- **数据库**: Cloudflare D1 (存储元数据和分析结果)
- **AI 模型**: Google Gemini API
- **前端**: 原生 HTML/CSS/JavaScript

### 数据流程
1. **认证**: 用户通过 ACCESS_TOKEN 进行身份验证
2. **输入处理**: 
   - 文本：直接传递给 LLM 分析
   - URL：下载 HTML，提取文本内容和表格
   - 图片：上传到 R2，使用视觉模型分析
3. **AI 分析**: 调用 Gemini API 生成摘要和关键词
4. **数据存储**: 原始内容存储在 R2，分析结果存储在 D1
5. **周报生成**: 每周日自动生成洞察报告

## 📊 数据库设计

### inputs 表
存储输入内容的元数据
```sql
CREATE TABLE inputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('text', 'url', 'image')),
    r2_object_key TEXT NOT NULL,
    original_content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### llm_outputs 表
存储 AI 分析结果
```sql
CREATE TABLE llm_outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_id INTEGER NOT NULL,
    summary TEXT NOT NULL,
    keywords TEXT NOT NULL, -- JSON 数组
    extracted_tables TEXT, -- JSON 字符串
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (input_id) REFERENCES inputs(id)
);
```

### weekly_insights 表
存储每周洞察报告
```sql
CREATE TABLE weekly_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insight_text TEXT NOT NULL,
    week_start_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 部署指南

### 前置要求
- Cloudflare 账户
- Google Cloud 账户（用于 Gemini API）
- 基本的 Web 开发知识

### 手动部署

由于 `wrangler login` 可能存在问题，推荐使用 Cloudflare Dashboard 进行手动部署：

```bash
# 1. 查看部署指南
./deploy.sh

# 或者
npm run guide
```

**重要提示**: 本项目支持两种部署方式：
1. **Cloudflare Pages (推荐)**: 通过 GitHub 同步自动部署
2. **手动部署**: 在 Cloudflare Dashboard 中手动操作

### Cloudflare Pages 部署

1. **准备 GitHub 仓库**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **连接到 Cloudflare Pages**
   - 访问 [Cloudflare Pages](https://pages.cloudflare.com/)
   - 点击 "Create a project" > "Connect to Git"
   - 选择你的 GitHub 仓库
   - 构建设置保持默认即可

3. **配置环境变量和绑定**
   - 在 Pages 项目设置中添加环境变量：
     - `ACCESS_TOKEN`: 你的访问令牌
     - `GEMINI_API_KEY`: Gemini API 密钥
   - 添加服务绑定：
     - D1 数据库: `D1_DB`
     - R2 存储桶: `R2_BUCKET`

详细步骤请参考 [QUICKSTART.md](./QUICKSTART.md)

### 1. 安装依赖
```bash
npm install
```

### 2. 创建 Cloudflare 资源
```bash
# 创建 D1 数据库
wrangler d1 create illuminateur-db

# 创建 R2 存储桶
wrangler r2 bucket create illuminateur-storage

# 初始化数据库表
wrangler d1 execute illuminateur-db --file=./schema.sql
```

### 3. 配置环境变量
更新 `wrangler.toml` 中的 `database_id`：
```toml
[[d1_databases]]
binding = "D1_DB"
database_name = "illuminateur-db"
database_id = "your-actual-database-id-here"
```

### 4. 设置密钥
```bash
# 设置访问令牌（用于应用认证）
wrangler secret put ACCESS_TOKEN

# 设置 AI API 密钥（支持多种提供商）
wrangler secret put AI_API_KEY

# 可选：设置 AI 提供商（默认: gemini）
wrangler secret put AI_PROVIDER

# 可选：设置 AI 模型（默认: gemini-2.5-flash）
wrangler secret put AI_MODEL

# 可选：设置 AI API 基础 URL
wrangler secret put AI_BASE_URL

# 向后兼容：仍支持原有的 Gemini 配置
wrangler secret put GEMINI_API_KEY
wrangler secret put GEMINI_MODEL
```

### 5. AI 配置选项

应用支持多种 AI 服务提供商，通过环境变量进行配置：

#### Gemini (Google) 配置
```bash
# 推荐配置方式
wrangler secret put AI_PROVIDER gemini
wrangler secret put AI_API_KEY your-gemini-api-key
wrangler secret put AI_MODEL gemini-2.5-flash
wrangler secret put AI_BASE_URL https://generativelanguage.googleapis.com
```

#### OpenAI 配置
```bash
wrangler secret put AI_PROVIDER openai
wrangler secret put AI_API_KEY your-openai-api-key
wrangler secret put AI_MODEL gpt-4
wrangler secret put AI_BASE_URL https://api.openai.com
```

#### 支持的模型
- **Gemini**: `gemini-2.5-flash`, `gemini-pro`, `gemini-pro-vision`
- **OpenAI**: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`

#### 向后兼容
应用仍支持原有的 `GEMINI_API_KEY` 和 `GEMINI_MODEL` 环境变量配置。

### 6. 部署应用
```bash
# 开发环境
npm run dev

# 生产部署
npm run deploy
```

## 🎯 功能特性

### 核心功能
- ✅ **多格式输入**: 支持文本、URL、图片三种输入方式
- ✅ **智能分析**: 支持多种 AI 模型（Gemini、OpenAI）生成摘要和关键词
- ✅ **数据持久化**: R2 存储原始文件，D1 存储结构化数据
- ✅ **周报生成**: 自动生成每周洞察报告
- ✅ **Web 界面**: 简洁美观的单页应用
- ✅ **多模型支持**: 灵活配置不同的 AI 服务提供商

### 处理逻辑

#### 文本处理
- 直接传递给 LLM 进行分析
- 生成摘要和 1-5 个关键词
- 原始文本保存为 `.txt` 文件

#### URL 处理
- 获取完整 HTML 内容
- 提取可读文本和表格数据
- HTML 文件存储在 R2
- 提取的内容发送给 LLM 分析

#### 图片处理
- 图片文件直接上传到 R2
- 使用 AI 视觉模型分析图片内容（支持 Gemini 和 OpenAI）
- 生成图片描述和相关关键词

## 🔧 API 接口

### POST /api/capture
提交内容进行分析

**请求头**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: multipart/form-data
```

**请求体**:
- `type`: 输入类型 (text/url/image)
- `content`: 文本内容或 URL (当 type 为 text 或 url 时)
- `file`: 图片文件 (当 type 为 image 时)

**响应**:
```json
{
  "success": true,
  "inputId": 123,
  "analysis": {
    "summary": "内容摘要",
    "keywords": ["关键词1", "关键词2"],
    "extractedTables": [...]
  }
}
```

### GET /api/insights
获取周报洞察

**请求头**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**响应**:
```json
[
  {
    "id": 1,
    "insight_text": "本周最有价值的洞察...",
    "week_start_date": "2024-01-07",
    "created_at": "2024-01-14T00:00:00.000Z"
  }
]
```

## ⚡ 定时任务

系统配置了每周日午夜 UTC 时间运行的 Cron 任务：
- 收集过去一周的所有分析摘要
- 使用 LLM 生成综合洞察
- 存储到 `weekly_insights` 表

## 🛡️ 安全考虑

**重要提醒**: 这是一个概念验证（POC）项目，用于快速验证核心想法，并非生产级的安全完备商业软件。

### 当前安全措施
- Bearer Token 认证
- 环境变量存储敏感信息
- 输入类型验证

### 生产环境建议
- 实现更强的身份认证机制
- 添加输入内容过滤和验证
- 设置 API 调用频率限制
- 加强错误处理和日志记录

## 🎨 界面预览

应用提供了简洁美观的 Web 界面：
- **捕获页面**: 支持三种输入方式的统一界面
- **洞察页面**: 展示历史周报和洞察
- **响应式设计**: 适配桌面和移动设备

## 📝 使用示例

1. **文本分析**:
   - 输入: "今天学习了 Cloudflare Workers 的部署流程..."
   - 输出: 摘要 + 关键词如 ["Cloudflare", "Workers", "部署"]

2. **URL 分析**:
   - 输入: "https://blog.cloudflare.com/workers-ai"
   - 输出: 网页内容摘要 + 提取的表格数据

3. **图片分析**:
   - 输入: 架构图或截图
   - 输出: 图片内容描述 + 相关技术关键词

## 🔄 开发工作流

```bash
# 本地开发
npm run dev

# 数据库操作
npm run db:init    # 初始化表结构

# 部署到生产
npm run deploy
```

## 📈 扩展可能性

- **多模型支持**: 集成更多 AI 模型
- **高级分析**: 情感分析、主题建模
- **数据可视化**: 添加图表和趋势分析
- **协作功能**: 多用户支持和分享机制
- **移动应用**: 开发原生移动客户端

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 LICENSE 文件