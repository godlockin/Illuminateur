# Illuminateur - 智能内容处理工具

一个部署在 Cloudflare Workers 上的智能内容处理工具，支持文本、URL 和图片的智能分析、翻译、摘要和标签生成。

## ✨ 功能特点

### 🔧 核心功能
- **多格式输入支持**：文本、URL、图片三种输入方式
- **智能内容提取**：自动从网页和图片中提取文本内容
- **双语翻译归一化**：自动生成中英文双语版本
- **智能摘要生成**：基于 AI 的内容摘要
- **自动标签生成**：智能分类和标签推荐
- **全文搜索**：支持关键词、类型、日期范围筛选
- **数据统计分析**：内容趋势和标签使用统计

### 🛠 技术特性
- **Serverless 架构**：基于 Cloudflare Workers
- **数据持久化**：使用 Cloudflare D1 数据库
- **AI 集成**：支持 Gemini API
- **OCR 处理**：图片文字识别
- **响应式设计**：现代化 Web 界面
- **访问控制**：基于 Token 的身份验证

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Cloudflare 账户
- Gemini API 密钥

### 1. 克隆项目
```bash
git clone <repository-url>
cd Illuminateur
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置 Cloudflare

#### 3.1 登录 Cloudflare
```bash
npx wrangler login
```

#### 3.2 创建 D1 数据库
```bash
npx wrangler d1 create illuminateur-db
```

复制输出的数据库 ID，更新 `wrangler.toml` 中的 `database_id`。

#### 3.3 初始化数据库
```bash
npm run db:init
```

### 4. 配置环境变量

在 Cloudflare Dashboard 中设置以下环境变量：

```bash
# 访问令牌（用于身份验证）
ACCESS_TOKEN=your-secure-access-token

# Gemini API 配置
GEMINI_API_KEY=your-gemini-api-key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
MODEL_NAME=gemini-1.5-flash

# 环境标识
ENVIRONMENT=production
```

### 5. 部署
```bash
npm run deploy
```

## 📖 使用指南

### 访问应用
部署完成后，访问你的 Cloudflare Workers 域名，使用配置的 `ACCESS_TOKEN` 登录。

### 内容处理

#### 文本处理
1. 选择「文本」输入类型
2. 在文本框中输入或粘贴内容
3. 点击「开始处理」

#### URL 处理
1. 选择「URL」输入类型
2. 输入网页链接
3. 系统会自动抓取网页内容并处理

#### 图片处理
1. 选择「图片」输入类型
2. 拖拽或点击上传图片文件
3. 系统会进行 OCR 识别并处理文本

### 搜索功能
- 点击搜索按钮打开搜索面板
- 支持关键词搜索
- 可按内容类型筛选
- 可按日期范围筛选
- 支持快捷键 `Ctrl/Cmd + K`

### 统计分析
- 点击统计按钮查看数据分析
- 支持按日/周/月查看趋势
- 显示热门标签和使用统计

## 🔧 开发指南

### 项目结构
```
Illuminateur/
├── src/
│   ├── index.js              # Worker 入口
│   ├── handlers/
│   │   └── requestHandler.js # 请求路由处理
│   ├── middleware/
│   │   └── auth.js           # 身份验证中间件
│   ├── services/
│   │   ├── contentService.js # 内容处理服务
│   │   ├── aiService.js      # AI 服务集成
│   │   ├── urlService.js     # URL 处理服务
│   │   ├── ocrService.js     # OCR 服务
│   │   ├── databaseService.js# 数据库服务
│   │   ├── searchService.js  # 搜索服务
│   │   └── statisticsService.js # 统计服务
│   └── utils/
│       └── cors.js           # CORS 工具
├── public/
│   ├── index.html            # 前端页面
│   ├── style.css             # 样式文件
│   └── script.js             # 前端脚本
├── schema.sql                # 数据库结构
├── wrangler.toml             # Cloudflare 配置
└── package.json              # 项目配置
```

### 本地开发
```bash
# 启动开发服务器
npm run dev

# 数据库迁移
npm run db:migrate
```

### API 接口

#### POST /api/process
处理内容（文本/URL/图片）

**请求参数：**
- `type`: 内容类型（text/url/image）
- `content`: 文本内容（type=text）
- `url`: 网页链接（type=url）
- `image`: 图片文件（type=image）

**响应示例：**
```json
{
  "id": "content-id",
  "extractedText": "提取的原始文本",
  "chineseText": "中文翻译版本",
  "englishText": "英文翻译版本",
  "summary": "内容摘要",
  "tags": [
    {
      "name": "标签名称",
      "category": "分类",
      "confidence": 0.95
    }
  ]
}
```

#### GET /api/search
搜索内容

**查询参数：**
- `q`: 搜索关键词
- `type`: 内容类型筛选
- `from`: 开始日期
- `to`: 结束日期
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）

#### GET /api/content/:id
获取内容详情

#### GET /api/statistics
获取统计数据

**查询参数：**
- `period`: 统计周期（day/week/month）
- `days`: 天数范围

#### GET /api/health
健康检查

## 🔒 安全说明

### 访问控制
- 所有 API 接口（除根路径和健康检查）都需要访问令牌验证
- 访问令牌通过 `X-Access-Token` 请求头传递
- 建议使用强随机字符串作为访问令牌

### 数据安全
- 所有数据存储在 Cloudflare D1 数据库中
- 支持 HTTPS 加密传输
- 不记录敏感信息

### 使用限制
- 图片文件大小限制：10MB
- 支持的图片格式：JPG、PNG、GIF、WebP
- URL 抓取超时：30秒

## 📊 监控和维护

### 定时任务
系统会自动执行以下定时任务：
- **每日统计**：生成标签使用统计
- **每周统计**：生成周度数据汇总

### 日志监控
可通过 Cloudflare Dashboard 查看：
- Worker 执行日志
- 错误和异常信息
- 性能指标

### 数据库维护
```bash
# 查看数据库状态
npx wrangler d1 execute illuminateur-db --command "SELECT COUNT(*) FROM contents;"

# 备份数据库
npx wrangler d1 backup create illuminateur-db
```

## 🛠 故障排除

### 常见问题

**1. 部署失败**
- 检查 `wrangler.toml` 配置
- 确认数据库 ID 正确
- 验证环境变量设置

**2. 身份验证失败**
- 检查 `ACCESS_TOKEN` 环境变量
- 确认请求头格式正确

**3. AI 处理失败**
- 验证 Gemini API 密钥
- 检查 API 配额和限制
- 确认网络连接正常

**4. 图片处理失败**
- 检查文件格式和大小
- 验证 OCR 服务配置

### 调试模式
```bash
# 启用详细日志
ENVIRONMENT=development npm run dev
```

## 🔄 更新和升级

### 版本更新
```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
npm install

# 运行数据库迁移
npm run db:migrate

# 重新部署
npm run deploy
```

### 数据迁移
如需修改数据库结构，请：
1. 更新 `schema.sql`
2. 创建迁移脚本
3. 在生产环境谨慎执行

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

### 代码规范
- 使用 ESLint 进行代码检查
- 遵循现有代码风格
- 添加必要的注释和文档

## 📞 支持

如有问题或建议，请：
- 提交 GitHub Issue
- 查看文档和 FAQ
- 参考 Cloudflare Workers 官方文档

---

**Illuminateur** - 让内容处理更智能 ✨