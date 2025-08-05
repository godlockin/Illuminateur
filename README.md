# 灵感收集器 (Inspiration Collector)

> 🚀 智能灵感收集与知识沉淀平台 - 将散落的灵感碎片转化为结构化知识

## 📖 项目简介

灵感收集器是一个基于AI驱动的知识管理工具，旨在解决以下痛点：
- **灵感碎片散落各处**：统一收集来自各个渠道的想法和内容
- **"读过"不等于"读懂"**：通过AI分析帮助深度理解和记忆
- **信息处理效率低**：自动标签、分类和摘要生成

## ✨ 核心特性

### 🎯 v0.1 MVP功能
- **多渠道内容接收**：支持文本、链接、邮件等多种输入方式
- **AI智能分析**：基于Google Gemini的内容摘要、关键词提取、情感分析
- **自动标签分类**：智能生成标签和分类，便于后续检索
- **简洁展示界面**：对话式交互，卡片式内容展示
- **实时统计**：收集数量、情感趋势等数据可视化

### 🔮 未来规划
- 内容关联推荐
- 知识图谱可视化
- 团队协作功能
- 高级分析报告
- 第三方应用集成

## 🛠 技术架构

### 技术栈
- **前端**: HTML5 + CSS3 + Vanilla JavaScript + Tailwind CSS
- **后端**: Cloudflare Workers (Serverless)
- **数据库**: Cloudflare D1 (SQLite)
- **AI服务**: Google Gemini API
- **部署**: Cloudflare Pages
- **存储**: Cloudflare KV (缓存)

### 架构图
```
用户输入 → Cloudflare Workers → Gemini API → 数据处理 → D1存储 → 前端展示
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Cloudflare账户
- Google AI Studio账户（获取Gemini API Key）

### 本地开发

1. **克隆项目**
```bash
git clone <your-repo-url>
cd inspiration-collector
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 复制配置文件
cp wrangler.toml.example wrangler.toml

# 编辑配置文件，填入你的配置
vim wrangler.toml
```

4. **初始化数据库**
```bash
# 创建D1数据库
npx wrangler d1 create inspiration-db

# 执行数据库初始化脚本
npx wrangler d1 execute inspiration-db --file=./schema/init.sql
```

5. **启动开发服务器**
```bash
# 启动开发服务器（推荐）
npm run dev

# 或者使用简单HTTP服务器（演示模式）
cd public && python3 -m http.server 3000
```

访问 `http://localhost:3000` 查看应用

> 💡 **演示模式**：项目包含模拟数据，可以在没有后端API的情况下体验完整功能。

### 部署到Cloudflare

1. **获取API密钥**
- 访问 [Google AI Studio](https://makersuite.google.com/) 获取Gemini API密钥

2. **上传到GitHub**
- 创建GitHub仓库
- 推送代码到仓库

3. **配置Cloudflare**
- 在Cloudflare Pages中连接GitHub仓库
- 创建D1数据库和KV存储
- 在项目设置中绑定资源和环境变量

## 📁 项目结构

```
inspiration-collector/
├── public/                 # 前端静态文件
│   ├── index.html         # 主页面
│   ├── css/
│   │   └── styles.css     # 样式文件
│   └── js/
│       ├── app.js         # 主应用逻辑
│       ├── api.js         # API客户端
│       └── ui.js          # UI工具函数
├── functions/             # Cloudflare Functions
│   └── api/
│       └── [[path]].js    # API路由处理
├── schema/
│   └── init.sql          # 数据库初始化脚本
├── package.json          # 项目配置
├── wrangler.toml         # Cloudflare配置
└── README.md            # 项目文档
```

## 🔧 配置说明

### Cloudflare配置

在 `wrangler.toml` 中配置：

```toml
name = "inspiration-collector"
compatibility_date = "2024-01-01"

# D1 数据库
[[d1_databases]]
binding = "DB"
database_name = "inspiration-db"
database_id = "your-database-id"

# KV存储
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-id"

# 环境变量
[vars]
GEMINI_API_KEY = "your-gemini-api-key"
```

### Gemini API配置

1. 访问 [Google AI Studio](https://makersuite.google.com/)
2. 创建新的API密钥
3. 在Cloudflare Dashboard中设置环境变量

## 📊 数据模型

### 内容表 (contents)
- `id`: 唯一标识符
- `original_content`: 原始内容
- `content_type`: 内容类型（text/url/email）
- `summary`: AI生成摘要
- `keywords`: 关键词（JSON数组）
- `tags`: 标签（JSON数组）
- `sentiment`: 情感分析分数
- `importance_score`: 重要性评分
- `created_at`: 创建时间

### 标签表 (tags)
- `id`: 标签ID
- `name`: 标签名称
- `count`: 使用次数
- `color`: 标签颜色

## 🎨 使用指南

### 基本操作

1. **添加内容**
   - 在输入框中粘贴文本、链接或邮件内容
   - 选择内容类型
   - 点击"收集灵感"按钮

2. **查看内容**
   - 浏览卡片式内容展示
   - 使用搜索和筛选功能
   - 点击卡片查看详情

3. **管理标签**
   - 查看自动生成的标签
   - 手动添加或编辑标签
   - 按标签筛选内容

### 高级功能

- **深度分析**：启用后进行更详细的AI分析
- **批量操作**：选择多个内容进行批量处理
- **数据导出**：导出内容为JSON或Markdown格式

## 🔍 API文档

### 主要端点

- `POST /api/content` - 提交新内容
- `GET /api/contents` - 获取内容列表
- `GET /api/stats` - 获取统计数据
- `GET /api/tags` - 获取标签列表
- `GET /api/search` - 搜索内容

详细API文档请参考代码中的注释。

## 🐛 故障排除

### 常见问题

1. **Gemini API调用失败**
   - 检查API密钥是否正确设置
   - 确认API配额是否充足
   - 查看网络连接状态

2. **数据库连接错误**
   - 确认D1数据库已正确创建
   - 检查wrangler.toml中的数据库配置
   - 运行数据库初始化脚本

3. **部署失败**
   - 检查Cloudflare账户权限
   - 确认所有环境变量已设置
   - 查看部署日志获取详细错误信息

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Cloudflare](https://cloudflare.com/) - 提供优秀的边缘计算平台
- [Google AI](https://ai.google/) - 提供强大的Gemini AI服务
- [Tailwind CSS](https://tailwindcss.com/) - 提供美观的CSS框架

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](https://github.com/your-username/inspiration-collector/issues)
- 发送邮件至：your-email@example.com

---

**注意**: 这是一个概念验证（POC）项目，用于快速验证核心想法，并非生产级的安全完备商业软件。在生产环境中使用前，请确保进行充分的安全审计和性能测试。