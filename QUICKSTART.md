# 🚀 Illuminateur 快速开始指南

## 📋 前置要求

1. **Node.js 18+** - [下载安装](https://nodejs.org/)
2. **Cloudflare 账户** - [免费注册](https://dash.cloudflare.com/sign-up)
3. **Google Gemini API 密钥** - [获取密钥](https://makersuite.google.com/app/apikey)

## 🚀 部署指南

### 前置要求
- Cloudflare 账户
- GitHub 账户
- Google Cloud 账户（用于 Gemini API）
- 基本的 Web 开发知识

### 方式一：Cloudflare Pages 部署（推荐）

这是最简单的部署方式，通过 GitHub 自动同步：

#### 步骤 1: 推送到 GitHub

```bash
# 初始化 Git 仓库（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub
git remote add origin https://github.com/your-username/illuminateur.git
git push -u origin main
```

#### 步骤 2: 连接 Cloudflare Pages

1. 访问 [Cloudflare Pages](https://pages.cloudflare.com/)
2. 点击 "Create a project"
3. 选择 "Connect to Git"
4. 授权并选择你的 GitHub 仓库
5. 项目名称：`illuminateur`
6. 构建设置保持默认，点击 "Save and Deploy"

#### 步骤 3: 创建必要资源

在 Cloudflare Dashboard 中创建：

1. **D1 数据库**
   - 进入 `Workers & Pages` > `D1 SQL Database`
   - 创建数据库：`illuminateur-db`
   - 复制 Database ID

2. **R2 存储桶**
   - 进入 `R2 Object Storage`
   - 创建存储桶：`illuminateur-storage`

#### 步骤 4: 配置 Pages 项目

1. **环境变量**
   - 在 Pages 项目中，进入 `Settings` > `Environment variables`
   - 添加变量：
     - `ACCESS_TOKEN`: 你的自定义访问令牌
     - `GEMINI_API_KEY`: [获取 Gemini API 密钥](https://makersuite.google.com/app/apikey)

2. **服务绑定**
   - 在 `Settings` > `Functions` > `Bindings`
   - 添加 D1 绑定：
     - 变量名：`D1_DB`
     - 数据库：选择 `illuminateur-db`
   - 添加 R2 绑定：
     - 变量名：`R2_BUCKET`
     - 存储桶：选择 `illuminateur-storage`

#### 步骤 5: 初始化数据库

1. 在 D1 数据库页面，点击 `Console`
2. 复制 `schema.sql` 的内容并执行

#### 步骤 6: 重新部署

1. 在 Pages 项目中，点击 `Deployments`
2. 点击 "Retry deployment" 或推送新的提交触发重新部署

### 方式二：手动部署

如果你不想使用 GitHub 同步，可以手动部署：

#### 步骤 1: 创建 Cloudflare 资源

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com
   - 使用你的 Cloudflare 账户登录

2. **创建 D1 数据库**
   - 进入 `Workers & Pages` > `D1 SQL Database`
   - 点击 `Create database`
   - 数据库名称：`illuminateur-db`
   - 创建完成后，**复制 Database ID**

3. **创建 R2 存储桶**
   - 进入 `R2 Object Storage`
   - 点击 `Create bucket`
   - 存储桶名称：`illuminateur-storage`
   - 选择合适的区域

#### 步骤 2: 更新配置文件

1. 编辑 `wrangler.toml` 文件
2. 将 `database_id` 替换为步骤1中复制的 Database ID
3. 确保 `bucket_name` 为 `illuminateur-storage`

#### 步骤 3: 初始化数据库

1. 在 Cloudflare Dashboard 的 D1 数据库页面
2. 点击 `Console` 标签
3. 复制 `schema.sql` 文件的内容并执行

#### 步骤 4: 创建 Worker

1. 进入 `Workers & Pages` > `Overview`
2. 点击 `Create application` > `Create Worker`
3. Worker 名称：`illuminateur`
4. 点击 `Deploy` 创建基础 Worker

#### 步骤 5: 配置 Worker

1. **设置环境变量**
   - 在 Worker 详情页面，点击 `Settings` > `Variables`
   - 添加环境变量：
     - `ACCESS_TOKEN`: 你的访问令牌（自定义）
     - `GEMINI_API_KEY`: 你的 Gemini API 密钥

2. **配置绑定**
   - 在 `Settings` > `Bindings` 中添加：
     - D1 Database: 变量名 `D1_DB`，选择 `illuminateur-db`
     - R2 Bucket: 变量名 `R2_BUCKET`，选择 `illuminateur-storage`

#### 步骤 6: 部署代码

1. 复制 `src/index.js` 的全部内容
2. 在 Worker 详情页面，点击 `Quick edit`
3. 粘贴代码并点击 `Save and deploy`

### 获取 Gemini API 密钥

1. 访问 https://makersuite.google.com/app/apikey
2. 登录 Google 账户并创建 API 密钥
3. 将密钥添加到 Worker 的环境变量中

## 🎯 开始使用

1. **访问应用**: 部署完成后，访问显示的 Worker URL
2. **输入访问令牌**: 使用步骤4中设置的 ACCESS_TOKEN
3. **开始分析**: 输入文本、URL 或上传图片进行分析

## 🔧 本地开发

```bash
# 启动本地开发服务器
npm run dev

# 访问 http://localhost:8787
```

## 📊 功能测试

### 测试文本分析
1. 选择「文本」类型
2. 输入："今天学习了 Cloudflare Workers 的无服务器架构，发现它非常适合构建轻量级的 AI 应用。"
3. 点击「分析并存储」

### 测试 URL 分析
1. 选择「URL」类型
2. 输入："https://blog.cloudflare.com/workers-ai"
3. 点击「分析并存储」

### 测试图片分析
1. 选择「图片」类型
2. 上传任意图片文件
3. 点击「分析并存储」

### 查看周报
1. 切换到「Weekly Insights」标签
2. 点击「🔄 Refresh」按钮
3. 周报会在每周日自动生成

## 🛠️ 常用命令

```bash
# 查看实时日志
wrangler tail

# 查看数据库内容
wrangler d1 execute illuminateur-db --command="SELECT * FROM inputs LIMIT 10;"

# 查看 R2 存储桶内容
wrangler r2 object list illuminateur-storage

# 更新密钥
wrangler secret put ACCESS_TOKEN
wrangler secret put GEMINI_API_KEY
```

## 🔍 故障排除

### 问题 1: 数据库连接失败
**解决方案**: 确保 `wrangler.toml` 中的 `database_id` 正确

### 问题 2: Gemini API 调用失败
**解决方案**: 
1. 检查 API 密钥是否正确设置
2. 确认 Google Cloud 项目已启用 Gemini API
3. 检查 API 配额是否充足

### 问题 3: 文件上传失败
**解决方案**: 确保 R2 存储桶已正确创建并绑定

### 问题 4: 认证失败
**解决方案**: 确认 ACCESS_TOKEN 已正确设置且与输入的令牌一致

## 📈 下一步

- 🔄 **定期使用**: 每天输入一些内容，积累数据
- 📊 **查看洞察**: 每周日查看自动生成的洞察报告
- 🎨 **自定义**: 根据需要修改 UI 样式和分析逻辑
- 🚀 **扩展**: 添加更多 AI 模型或分析维度

## 💡 使用技巧

1. **文本输入**: 适合记录想法、学习笔记、会议纪要
2. **URL 分析**: 适合分析文章、博客、新闻内容
3. **图片分析**: 适合分析图表、截图、手写笔记
4. **关键词**: 可用于后续搜索和分类
5. **周报**: 帮助发现思维模式和知识盲点

## 🤝 获得帮助

- 📖 查看完整文档: `README.md`
- 🐛 报告问题: 创建 GitHub Issue
- 💬 讨论交流: 欢迎提出改进建议

---

**🎉 恭喜！你的个人洞察收集器已经准备就绪！**