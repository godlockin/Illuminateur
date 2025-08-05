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

## 🛠️ 本地开发配置步骤

### 1. 复制配置模板
```bash
# 复制Wrangler配置模板
cp wrangler.toml.example wrangler.toml

# 复制环境变量模板
cp .env.example .env
```

### 2. 创建Cloudflare资源
```bash
# 登录Cloudflare
npx wrangler login

# 创建D1数据库
npx wrangler d1 create illuminateur-db
# 记录返回的database_id

# 创建KV命名空间
npx wrangler kv:namespace create "CACHE"
npx wrangler kv:namespace create "CACHE" --preview
# 记录返回的namespace_id和preview_id
```

### 3. 配置wrangler.toml
编辑 `wrangler.toml` 文件，填入实际的ID：

```toml
# 取消注释并填入实际ID
[[d1_databases]]
binding = "DB"
database_name = "illuminateur-db"
database_id = "你的实际数据库ID"

[[kv_namespaces]]
binding = "CACHE"
id = "你的实际KV命名空间ID"
preview_id = "你的实际KV预览ID"
```

### 4. 配置环境变量
编辑 `.env` 文件：
```env
GEMINI_API_KEY=你的Gemini API密钥
ENVIRONMENT=development
```

### 5. 初始化数据库
```bash
# 运行数据库初始化脚本
npx wrangler d1 execute illuminateur-db --file=./schema/init.sql
```

## 🚀 生产环境配置

### Cloudflare Pages配置

1. **环境变量配置**
   - 进入 Cloudflare Pages 项目设置
   - 添加环境变量：
     - `GEMINI_API_KEY`: 你的Gemini API密钥
     - `ENVIRONMENT`: `production`

2. **D1数据库绑定**
   - 进入 Functions 设置
   - 添加 D1 database binding：
     - Variable name: `DB`
     - Database: 选择你创建的数据库

3. **KV存储绑定**
   - 添加 KV namespace binding：
     - Variable name: `CACHE`
     - Namespace: 选择你创建的命名空间

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

## 🚨 如果敏感信息已经被提交

如果你不小心将包含敏感信息的文件提交到了Git，需要立即采取以下措施：

### 1. 立即更换所有敏感信息
```bash
# 重新生成API密钥
# 删除并重新创建数据库和KV命名空间
npx wrangler d1 delete illuminateur-db
npx wrangler d1 create illuminateur-db
```

### 2. 清理Git历史
```bash
# 从Git历史中完全删除敏感文件
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch wrangler.toml' \
--prune-empty --tag-name-filter cat -- --all

# 强制推送（谨慎操作）
git push origin --force --all
```

### 3. 通知团队成员
- 通知所有有权限的团队成员
- 要求他们重新克隆仓库
- 更新所有相关的配置

## 📞 支持

如果在配置过程中遇到问题，请检查：
1. Cloudflare账户权限
2. API密钥有效性
3. 网络连接状态
4. Wrangler CLI版本

---

**记住：安全无小事，宁可多花时间配置，也不要泄露敏感信息！** 🔒