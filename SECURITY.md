# 🔐 安全配置指南

## 概述

本项目采用分离式配置管理，确保敏感信息（如数据库ID、API密钥等）不会被提交到公开的Git仓库中。

## 🚨 重要安全原则

1. **永远不要将敏感信息提交到Git仓库**
2. **使用模板文件和环境变量管理配置**
3. **在生产环境中使用Cloudflare Dashboard管理敏感配置**

## 📁 配置文件说明

### 文件结构
```
├── wrangler.toml.example    # 配置模板（安全，可提交到Git）
├── wrangler.toml           # 实际配置（包含敏感信息，已被.gitignore忽略）
├── .env.example            # 环境变量模板
└── .env                    # 实际环境变量（已被.gitignore忽略）
```

### 配置优先级
1. **本地开发**: 使用 `wrangler.toml` + `.env`
2. **生产部署**: 使用 Cloudflare Dashboard 配置

## 🛠️ 通过Cloudflare Dashboard配置步骤

### 1. 创建D1数据库

1. **进入D1数据库管理页面**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 点击左侧菜单的 **"Workers & Pages"**
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

### 2. 创建KV命名空间

1. **进入KV存储管理页面**
   - 在Cloudflare Dashboard中，点击左侧菜单的 **"Workers & Pages"**
   - 点击顶部的 **"KV"** 标签
   - 点击 **"Create a namespace"** 按钮

2. **创建命名空间**
   - **Namespace Name**: 输入 `CACHE`
   - 点击 **"Add"** 按钮

### 3. 配置Pages项目绑定

1. **进入Pages项目设置**
   - 在Cloudflare Dashboard中，点击左侧菜单的 **"Workers & Pages"**
   - 点击顶部的 **"Pages"** 标签
   - 找到你的项目并点击进入
   - 点击 **"Settings"** 标签

2. **配置D1数据库绑定**
   - 点击左侧菜单的 **"Functions"**
   - 滚动到 **"D1 database bindings"** 部分
   - 点击 **"Add binding"**
   - 填写：
     - **Variable name**: `DB`
     - **D1 database**: 选择 `illuminateur-db`
   - 点击 **"Save"**

3. **配置KV存储绑定**
   - 在同一页面的 **"KV namespace bindings"** 部分
   - 点击 **"Add binding"**
   - 填写：
     - **Variable name**: `CACHE`
     - **KV namespace**: 选择 `CACHE`
   - 点击 **"Save"**

4. **配置环境变量**
   - 点击左侧菜单的 **"Environment variables"**
   - 点击 **"Add variable"**
   - 添加以下变量：
     - **GEMINI_API_KEY**: 你的Gemini API密钥
     - **ENVIRONMENT**: `production`

## 🚀 生产环境配置

生产环境的配置已在上述步骤3中完成。确保以下配置正确：

### 环境变量配置
- `GEMINI_API_KEY`: 你的Gemini API密钥
- `ENVIRONMENT`: `production`

### D1数据库绑定
- **变量名**: `DB`
- **数据库**: `illuminateur-db`

### KV命名空间绑定
- **变量名**: `CACHE`
- **命名空间**: `CACHE`

### 验证配置
1. 在Pages项目的 **Settings** → **Functions** 页面确认：
   - D1数据库绑定显示为 `DB` → `illuminateur-db`
   - KV命名空间绑定显示为 `CACHE` → `CACHE`
2. 在 **Environment variables** 页面确认环境变量已正确设置
3. 重新部署项目以应用新配置

## 🔍 安全检查清单

### 提交前检查
- [ ] `wrangler.toml` 已被 `.gitignore` 忽略
- [ ] `.env` 已被 `.gitignore` 忽略
- [ ] 没有硬编码任何API密钥或数据库ID
- [ ] 只提交 `.example` 模板文件

### 部署前检查
- [ ] Cloudflare Pages 环境变量已配置
- [ ] D1数据库绑定已设置
- [ ] KV命名空间绑定已设置
- [ ] 数据库已初始化

## 🚨 紧急处理：如果敏感信息已提交

如果不小心将敏感信息提交到Git仓库：

### 1. 立即更改密钥和资源
- **重新生成Gemini API密钥**：
  - 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
  - 删除旧的API密钥
  - 创建新的API密钥
  - 在Cloudflare Pages中更新环境变量

- **重新创建Cloudflare资源**（如果ID已暴露）：
  - 在Cloudflare Dashboard中删除旧的D1数据库和KV命名空间
  - 按照上述步骤重新创建资源
  - 重新配置绑定

### 2. 清理仓库
- **删除敏感文件**：
  - 在GitHub网页界面中删除 `wrangler.toml` 和 `.env` 文件
  - 或者在本地删除后提交：`git rm wrangler.toml .env && git commit -m "Remove sensitive files"`

- **联系GitHub支持**（如果需要彻底清理历史）：
  - 访问 [GitHub Support](https://support.github.com/)
  - 请求帮助清理敏感信息的提交历史

### 3. 重新配置安全设置
- 确认 `.gitignore` 文件包含 `wrangler.toml` 和 `.env*`
- 重新按照上述UI配置步骤设置Cloudflare资源
- 验证敏感文件不再被Git跟踪
- 在Cloudflare Pages中更新所有环境变量和绑定

## 📞 支持

如果在配置过程中遇到问题，请检查：
1. Cloudflare账户权限
2. API密钥有效性
3. 网络连接状态
4. Wrangler CLI版本

---

**记住：安全无小事，宁可多花时间配置，也不要泄露敏感信息！** 🔒