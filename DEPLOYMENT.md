# 部署指南

## 📋 部署概述

本项目设计为通过GitHub + Cloudflare Pages的方式进行部署，无需复杂的CI/CD配置。

## 🚀 部署步骤

### 1. 准备GitHub仓库

```bash
# 在项目根目录下初始化Git仓库
git init
git add .
git commit -m "Initial commit: 灵感收集器项目"

# 添加远程仓库（替换为你的GitHub仓库地址）
git remote add origin https://github.com/your-username/inspiration-collector.git
git branch -M main
git push -u origin main
```

### 2. 配置Cloudflare Pages

1. **登录Cloudflare Dashboard**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入 "Pages" 页面

2. **创建新项目**
   - 点击 "Create a project"
   - 选择 "Connect to Git"
   - 授权并选择你的GitHub仓库

3. **配置构建设置**
   ```
   项目名称: inspiration-collector
   生产分支: main
   构建命令: npm run build
   构建输出目录: public
   ```

### 3. 创建Cloudflare资源

#### 创建D1数据库
```bash
# 安装Wrangler CLI（如果还没有）
npm install -g wrangler

# 登录Cloudflare
npx wrangler login

# 创建D1数据库
npx wrangler d1 create inspiration-db
```

记录返回的数据库ID，格式类似：
```
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### 创建KV命名空间
```bash
# 创建生产环境KV命名空间
npx wrangler kv:namespace create "CACHE"

# 创建预览环境KV命名空间
npx wrangler kv:namespace create "CACHE" --preview
```

记录返回的命名空间ID。

#### 初始化数据库
```bash
# 执行数据库初始化脚本
npx wrangler d1 execute inspiration-db --file=./schema/init.sql
```

### 4. 配置环境变量和绑定

在Cloudflare Pages项目的设置页面中：

#### 环境变量
- `GEMINI_API_KEY`: 你的Google Gemini API密钥
- `ENVIRONMENT`: `production`

#### 函数绑定
在 "Functions" 标签页中添加：

**D1数据库绑定**
- 变量名: `DB`
- D1数据库: 选择刚创建的 `inspiration-db`

**KV存储绑定**
- 变量名: `CACHE`
- KV命名空间: 选择刚创建的 `CACHE` 命名空间

### 5. 获取Gemini API密钥

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建新的API密钥
3. 将密钥添加到Cloudflare Pages的环境变量中

### 6. 部署验证

1. **触发部署**
   - 推送代码到GitHub主分支会自动触发部署
   - 或在Cloudflare Pages中手动触发部署

2. **检查部署状态**
   - 在Cloudflare Pages项目页面查看部署日志
   - 确认所有构建步骤都成功完成

3. **测试功能**
   - 访问分配的Pages URL
   - 测试内容提交功能
   - 检查AI分析是否正常工作

## 🔧 故障排除

### 常见问题

1. **构建失败**
   - 检查 `package.json` 中的构建脚本
   - 确认所有依赖都已正确安装

2. **API调用失败**
   - 验证Gemini API密钥是否正确设置
   - 检查API配额是否充足

3. **数据库连接错误**
   - 确认D1数据库绑定配置正确
   - 检查数据库是否已正确初始化

4. **KV存储问题**
   - 验证KV命名空间绑定配置
   - 确认命名空间ID正确

### 调试技巧

1. **查看实时日志**
   ```bash
   npx wrangler pages deployment tail
   ```

2. **本地测试**
   ```bash
   npm run dev
   ```

3. **检查函数日志**
   - 在Cloudflare Dashboard的Functions页面查看日志

## 📝 更新部署

### 代码更新
```bash
# 提交更改
git add .
git commit -m "更新功能描述"
git push origin main
```

推送到main分支会自动触发重新部署。

### 配置更新
- 环境变量更改：在Cloudflare Pages设置中修改
- 数据库结构更改：执行新的SQL脚本
- 依赖更新：更新 `package.json` 并推送

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