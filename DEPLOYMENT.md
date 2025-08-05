# 🚀 Illuminateur 部署指南

本指南将帮助你将 Illuminateur 项目部署到 Cloudflare Pages，实现一个功能完整的灵感收集和分析平台。

## ⚠️ 安全提醒

**在开始部署之前，请务必阅读 [SECURITY.md](./SECURITY.md) 文档，了解如何安全地管理配置信息，避免将敏感数据提交到Git仓库。**

## 📋 部署概述

本项目设计为通过GitHub + Cloudflare Pages的方式进行部署，无需复杂的CI/CD配置。

## 🚀 详细部署步骤

### 第一步：准备GitHub仓库

如果你还没有将项目推送到GitHub，请执行以下操作：

```bash
# 在项目根目录下初始化Git仓库
git init
git add .
git commit -m "Initial commit: Illuminateur项目"

# 添加远程仓库（替换为你的GitHub仓库地址）
git remote add origin https://github.com/godlockin/Illuminateur.git
git branch -M main
git push -u origin main
```

### 第二步：配置Cloudflare Pages（详细操作）

#### 2.1 登录Cloudflare Dashboard
1. 打开浏览器，访问 [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. 使用你的Cloudflare账号登录（如果没有账号，请先注册）
3. 登录后，你会看到Cloudflare的主控制面板

#### 2.2 进入Pages页面
1. 在左侧导航栏中，找到并点击 **"Workers & Pages"**
2. 在顶部标签栏中，点击 **"Pages"** 标签
3. 你会看到Pages项目列表页面

#### 2.3 创建新的Pages项目
1. 点击右上角的蓝色按钮 **"Create application"**
2. 在弹出的选项中，选择 **"Pages"**
3. 选择 **"Connect to Git"** 选项

#### 2.4 连接GitHub账号
1. 如果这是你第一次使用，会提示你连接Git提供商
2. 点击 **"GitHub"** 图标
3. 系统会跳转到GitHub授权页面
4. 点击 **"Authorize Cloudflare-Pages"** 授权Cloudflare访问你的GitHub
5. 选择要授权的仓库范围（建议选择 "Only select repositories" 并选择Illuminateur仓库）
6. 点击 **"Install & Authorize"**

#### 2.5 选择项目仓库
1. 授权完成后，你会回到Cloudflare Pages页面
2. 在仓库列表中找到 **"godlockin/Illuminateur"**
3. 点击该仓库右侧的 **"Begin setup"** 按钮

#### 2.6 配置构建设置
在项目配置页面，按以下方式填写：

**基本设置：**
- **Project name（项目名称）**: `illuminateur`（或你喜欢的名称）
- **Production branch（生产分支）**: `main`

**构建设置：**
- **Framework preset（框架预设）**: 选择 "None" 或 "Static site"
- **Build command（构建命令）**: 留空（因为这是静态站点）
- **Build output directory（构建输出目录）**: `public`

**环境变量（暂时跳过，稍后配置）**

点击 **"Save and Deploy"** 开始首次部署

### 第三步：创建Cloudflare资源（通过Dashboard UI）

#### 3.1 创建D1数据库

1. **进入D1数据库管理页面**
   - 在Cloudflare Dashboard中，点击左侧菜单的 **"Workers & Pages"**
   - 点击顶部的 **"D1 SQL Database"** 标签
   - 点击 **"Create database"** 按钮

2. **配置数据库**
   - **Database name**: 输入 `illuminateur-db`
   - **Location**: 选择离你最近的区域（如 Asia Pacific）
   - 点击 **"Create"** 按钮

3. **初始化数据库结构**
   - 数据库创建完成后，点击进入数据库详情页
   - 点击 **"Console"** 标签
   - 将以下SQL代码复制粘贴到控制台中：

```sql
CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT NOT NULL,
    summary TEXT,
    keywords TEXT,
    tags TEXT,
    category TEXT,
    sentiment TEXT,
    importance_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_content INTEGER DEFAULT 0,
    total_tags INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO stats (total_content, total_tags) VALUES (0, 0);
```

   - 点击 **"Execute"** 按钮执行SQL
   - 确认看到 "Success" 提示

#### 3.2 创建KV命名空间

1. **进入KV存储管理页面**
   - 在Cloudflare Dashboard中，点击左侧菜单的 **"Workers & Pages"**
   - 点击顶部的 **"KV"** 标签
   - 点击 **"Create a namespace"** 按钮

2. **创建生产环境命名空间**
   - **Namespace Name**: 输入 `CACHE`
   - 点击 **"Add"** 按钮

3. **记录命名空间信息**
   - 创建完成后，记录显示的 **Namespace ID**
   - 这个ID稍后在绑定配置中会用到

### 第四步：配置环境变量和绑定（在Cloudflare Pages中）

#### 4.1 进入项目设置页面

1. 回到Cloudflare Dashboard的Pages页面
2. 找到你刚创建的 `illuminateur` 项目
3. 点击项目名称进入项目详情页
4. 点击顶部的 **"Settings"** 标签

#### 4.2 配置环境变量

1. 在Settings页面中，找到左侧菜单的 **"Environment variables"**
2. 点击进入环境变量配置页面
3. 点击 **"Add variable"** 按钮

**添加以下环境变量：**

**变量1：GEMINI_API_KEY**
- Variable name: `GEMINI_API_KEY`
- Value: `你的Google Gemini API密钥`（稍后获取）
- Environment: 选择 **"Production"**
- 点击 **"Save"**

**变量2：ENVIRONMENT**
- Variable name: `ENVIRONMENT`
- Value: `production`
- Environment: 选择 **"Production"**
- 点击 **"Save"**

#### 4.3 配置函数绑定

1. 在Settings页面的左侧菜单中，点击 **"Functions"**
2. 滚动到页面下方，找到 **"Bindings"** 部分

**添加D1数据库绑定：**
1. 在 **"D1 database bindings"** 部分，点击 **"Add binding"**
2. 填写以下信息：
   - **Variable name**: `DB`
   - **D1 database**: 从下拉菜单中选择你刚创建的 `illuminateur-db`
3. 点击 **"Save"**

**添加KV存储绑定：**
1. 在 **"KV namespace bindings"** 部分，点击 **"Add binding"**
2. 填写以下信息：
   - **Variable name**: `CACHE`
   - **KV namespace**: 从下拉菜单中选择你刚创建的 `CACHE` 命名空间
3. 点击 **"Save"**

#### 4.4 验证配置

配置完成后，你应该能在Functions页面看到：
- **Environment variables**: GEMINI_API_KEY, ENVIRONMENT
- **D1 database bindings**: DB → illuminateur-db
- **KV namespace bindings**: CACHE → CACHE

**重要提示：** 所有资源都是通过Cloudflare Dashboard的UI界面创建和绑定的，无需手动管理配置文件或ID。

### 第五步：获取Gemini API密钥（详细步骤）

#### 5.1 访问Google AI Studio

1. 打开浏览器，访问 [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. 使用你的Google账号登录
3. 如果是第一次使用，可能需要同意服务条款

#### 5.2 创建API密钥

1. 在API keys页面，点击 **"Create API key"** 按钮
2. 在弹出的对话框中：
   - 选择 **"Create API key in new project"**（推荐）
   - 或者选择现有的Google Cloud项目
3. 点击 **"Create"** 按钮
4. 系统会生成一个新的API密钥，格式类似：`AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

#### 5.3 保存API密钥

**重要安全提示：**
- 立即复制并保存这个API密钥
- 不要在代码中硬编码这个密钥
- 不要将密钥提交到Git仓库

#### 5.4 将密钥添加到Cloudflare Pages

1. 回到Cloudflare Pages项目的Settings页面
2. 进入 **"Environment variables"**
3. 找到之前创建的 `GEMINI_API_KEY` 变量
4. 点击 **"Edit"** 按钮
5. 将刚才复制的API密钥粘贴到Value字段
6. 点击 **"Save"**

#### 5.5 验证API密钥

你可以通过以下方式验证API密钥是否有效：

```bash
# 在本地测试API密钥（可选）
curl -H 'Content-Type: application/json' \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     -X POST 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY'
```

将 `YOUR_API_KEY` 替换为你的实际API密钥。

### 第六步：部署验证和测试

#### 6.1 触发重新部署

由于我们添加了环境变量和绑定，需要重新部署项目：

**在Cloudflare Pages中手动触发部署：**
1. 进入你的项目详情页
2. 点击 **"Deployments"** 标签
3. 点击 **"Create deployment"** 按钮
4. 选择 `main` 分支
5. 点击 **"Save and Deploy"**

**注意：** 每次修改环境变量或绑定配置后，都需要重新部署才能生效。

#### 6.2 监控部署过程

1. **查看部署状态**
   - 在Deployments页面，你会看到部署进度
   - 状态会从 "Building" → "Deploying" → "Success"

2. **查看构建日志**
   - 点击正在进行的部署
   - 查看详细的构建日志
   - 确认没有错误信息

3. **获取部署URL**
   - 部署成功后，会显示项目的访问URL
   - 格式通常是：`https://illuminateur.pages.dev`
   - 或者自定义域名

#### 6.3 功能测试清单

**基础功能测试：**

1. **访问网站**
   - 打开部署URL
   - 确认页面正常加载
   - 检查界面是否完整显示

2. **测试内容提交**
   - 在输入框中输入一些测试内容
   - 点击提交按钮
   - 观察是否有响应

3. **测试AI分析功能**
   - 提交内容后，检查是否有AI分析结果
   - 验证分析结果是否合理

4. **测试数据持久化**
   - 刷新页面
   - 检查之前提交的内容是否还在

#### 6.4 故障排除

**如果部署失败：**
1. 检查构建日志中的错误信息
2. 确认所有环境变量都已正确设置
3. 验证D1数据库和KV绑定是否正确

**如果功能不正常：**
1. 打开浏览器开发者工具（F12）
2. 查看Console标签中的错误信息
3. 检查Network标签中的API请求状态

**常见问题解决：**
- **500错误**：通常是环境变量或绑定配置问题
- **API调用失败**：检查Gemini API密钥是否正确
- **数据库错误**：确认D1数据库已正确初始化

#### 6.5 性能验证

1. **检查加载速度**
   - 使用浏览器开发者工具测试页面加载时间
   - 确认静态资源加载正常

2. **测试API响应时间**
   - 提交内容并观察响应时间
   - 正常情况下应在几秒内完成

3. **验证缓存功能**
   - 多次访问相同内容
   - 检查是否使用了KV缓存

## 🔧 故障排除

### 常见问题

1. **部署错误："If are uploading a directory of assets"**
   - **问题原因**：项目被误认为是Worker项目而不是Pages项目
   - **解决方案**：
     - 确保项目是通过GitHub连接到Cloudflare Pages创建的
     - 检查项目类型：在Cloudflare Dashboard中，项目应该显示在 "Pages" 标签下，而不是 "Workers" 标签下
     - 如果项目在Workers下，请删除并重新创建为Pages项目
     - 确保 `wrangler.toml` 文件包含 `pages_build_output_dir = "public"` 配置

2. **构建失败**
   - 检查 `package.json` 中的构建脚本
   - 确认所有依赖都已正确安装

3. **API调用失败**
   - 验证Gemini API密钥是否正确设置
   - 检查API配额是否充足

4. **数据库连接错误**
   - 确认D1数据库绑定配置正确
   - 检查数据库是否已正确初始化

5. **KV存储问题**
   - 验证KV命名空间绑定配置
   - 确认命名空间ID正确

### 调试技巧

1. **查看部署日志**
   - 在Cloudflare Pages项目的 "Deployments" 页面
   - 点击具体的部署记录查看详细日志
   - 查看构建过程中的错误信息

2. **检查函数日志**
   - 在Cloudflare Dashboard的Functions页面查看实时日志
   - 使用浏览器开发者工具查看网络请求

3. **验证配置**
   - 确认所有环境变量都已正确设置
   - 检查D1数据库和KV绑定是否正确配置
   - 验证Gemini API密钥是否有效

## 📝 更新部署

### 代码更新
当你需要更新代码时：
1. 将更新后的代码推送到GitHub的main分支
2. Cloudflare Pages会自动检测到更改并触发重新部署
3. 在Deployments页面可以查看部署进度

### 配置更新
- **环境变量更改**：在Cloudflare Pages项目设置的 "Environment variables" 中修改
- **数据库结构更改**：在D1数据库的Console中执行新的SQL脚本
- **绑定更新**：在Functions设置中修改D1或KV绑定
- **依赖更新**：更新代码中的依赖后推送到GitHub

## 🔒 安全注意事项

1. **API密钥管理**
   - 永远不要在代码中硬编码API密钥
   - 使用Cloudflare的环境变量功能

2. **访问控制**
   - 考虑添加身份验证机制
   - 设置适当的CORS策略

3. **数据保护**
   - 定期备份D1数据库
   - 监控API使用情况

## 📊 监控和维护

1. **性能监控**
   - 使用Cloudflare Analytics监控访问情况
   - 关注API响应时间

2. **成本控制**
   - 监控Gemini API使用量
   - 设置适当的使用限制

3. **定期维护**
   - 更新依赖包
   - 检查安全漏洞
   - 优化数据库性能

---

**注意**: 这是一个概念验证（POC）项目，在生产环境中使用前请确保进行充分的安全审计和性能测试。