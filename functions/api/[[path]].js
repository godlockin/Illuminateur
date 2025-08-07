// 灵感收集器 - Cloudflare Workers API处理器

// Gemini API配置
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// 路由处理器
const routes = {
  'POST /api/content': handleSubmitContent,
  'POST /api/email': handleEmailContent,
  'GET /api/contents': handleGetContents,
  'GET /api/content/:id': handleGetContent,
  'PUT /api/content/:id': handleUpdateContent,
  'DELETE /api/content/:id': handleDeleteContent,
  'GET /api/stats': handleGetStats,
  'GET /api/tags': handleGetTags,
  'POST /api/tags': handleCreateTag,
  'GET /api/search': handleSearch,
  'POST /api/analyze': handleAnalyzeContent,
  'GET /api/health': handleHealthCheck,
  'GET /api/version': handleVersion
};

// 主处理函数
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;
  
  // CORS处理
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders()
    });
  }
  
  try {
    // 路由匹配
    const routeKey = `${method} ${path}`;
    const handler = findRouteHandler(routeKey, routes);
    
    if (!handler) {
      return jsonResponse({ error: 'Route not found' }, 404);
    }
    
    // 认证检查（除了健康检查和版本接口）
    if (!path.includes('/health') && !path.includes('/version')) {
      const authResult = await checkAuthentication(request, env);
      if (!authResult.success) {
        return jsonResponse({ error: authResult.error }, 401);
      }
    }
    
    // 执行处理器
    const result = await handler(request, env, context);
    return result;
    
  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({
      error: 'Internal server error',
      message: error.message
    }, 500);
  }
}

// 路由匹配函数
function findRouteHandler(routeKey, routes) {
  // 精确匹配
  if (routes[routeKey]) {
    return routes[routeKey];
  }
  
  // 参数匹配
  for (const [pattern, handler] of Object.entries(routes)) {
    if (matchRoute(routeKey, pattern)) {
      return handler;
    }
  }
  
  return null;
}

// 路由参数匹配
function matchRoute(routeKey, pattern) {
  const routeParts = routeKey.split(' ');
  const patternParts = pattern.split(' ');
  
  if (routeParts[0] !== patternParts[0]) return false; // 方法不匹配
  
  const routePath = routeParts[1].split('/');
  const patternPath = patternParts[1].split('/');
  
  if (routePath.length !== patternPath.length) return false;
  
  for (let i = 0; i < routePath.length; i++) {
    if (patternPath[i].startsWith(':')) continue; // 参数占位符
    if (routePath[i] !== patternPath[i]) return false;
  }
  
  return true;
}

// 提交内容处理器
async function handleSubmitContent(request, env) {
  try {
    const data = await request.json();
    const { content, type = 'text', autoTag = true, deepAnalysis = false } = data;
    
    if (!content || content.trim().length === 0) {
      return jsonResponse({ error: '内容不能为空' }, 400);
    }
    
    // 生成唯一ID
    const id = generateId();
    const now = new Date().toISOString();
    
    let processedContent = content.trim();
    let sourceInfo = null;
    let extractedTitle = null;
    
    // 如果是URL类型，先抓取内容
    if (type === 'url') {
      const urlPattern = /^https?:\/\/.+/i;
      if (urlPattern.test(processedContent)) {
        const urlData = await fetchUrlContent(processedContent);
        sourceInfo = JSON.stringify({
          originalUrl: processedContent,
          title: urlData.title,
          extractedAt: urlData.extractedAt,
          error: urlData.error
        });
        
        // 如果成功抓取到内容，使用抓取的内容进行分析
        if (urlData.content && !urlData.error) {
          processedContent = `标题: ${urlData.title}\n\n内容: ${urlData.content}`;
          extractedTitle = urlData.title;
        }
      } else {
        return jsonResponse({ error: '请提供有效的URL地址' }, 400);
      }
    }
    
    // 基础内容对象
    const contentObj = {
      id,
      original_content: content.trim(), // 保存原始输入
      content_type: type,
      source_info: sourceInfo,
      created_at: now,
      updated_at: now,
      last_accessed: now
    };
    
    // AI分析（如果配置了API密钥）
    if (env.GEMINI_API_KEY && autoTag) {
      const analysis = await analyzeWithGemini(processedContent, { autoTag, deepAnalysis }, env.GEMINI_API_KEY);
      
      contentObj.summary = analysis.summary || extractedTitle || generateSummary(processedContent);
      contentObj.keywords = JSON.stringify(analysis.keywords || []);
      contentObj.tags = JSON.stringify(analysis.tags || []);
      contentObj.sentiment = analysis.sentiment || 0;
      contentObj.category = analysis.category || 'general';
      contentObj.importance_score = analysis.importance_score || 0.5;
    } else {
      // 基础分析
      contentObj.summary = extractedTitle || generateSummary(processedContent);
      contentObj.keywords = JSON.stringify(extractBasicKeywords(processedContent));
      contentObj.tags = JSON.stringify([type === 'url' ? '链接' : '未分类']);
      contentObj.sentiment = 0;
      contentObj.category = type === 'url' ? 'article' : 'general';
      contentObj.importance_score = 0.5;
    }
    
    // 计算字数和阅读时间
    contentObj.word_count = processedContent.length;
    contentObj.reading_time = Math.ceil(processedContent.length / 200); // 假设每分钟200字
    
    // 保存到数据库
    await saveContent(contentObj, env.DB);
    
    // 更新标签统计
    if (contentObj.tags) {
      const tags = JSON.parse(contentObj.tags);
      await updateTags(tags, env.DB);
    }
    
    // 更新统计
    await updateStats(env.DB);
    
    return jsonResponse({
      success: true,
      data: {
        id: contentObj.id,
        summary: contentObj.summary,
        tags: JSON.parse(contentObj.tags || '[]'),
        sentiment: contentObj.sentiment,
        category: contentObj.category,
        extractedTitle: extractedTitle
      }
    });
    
  } catch (error) {
    console.error('Submit content error:', error);
    return jsonResponse({ error: '提交失败: ' + error.message }, 500);
  }
}

// 邮件内容处理器
async function handleEmailContent(request, env) {
  try {
    const data = await request.json();
    const { from, subject, text, html, attachments = [] } = data;
    
    if (!text && !html) {
      return jsonResponse({ error: '邮件内容不能为空' }, 400);
    }
    
    // 处理邮件内容
    let content = text || '';
    if (html && !text) {
      // 简单的HTML转文本
      content = html
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/<p[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    }
    
    // 构建完整内容
    let fullContent = '';
    if (subject) {
      fullContent += `主题: ${subject}\n\n`;
    }
    fullContent += content;
    
    // 处理附件信息
    if (attachments.length > 0) {
      fullContent += '\n\n附件:\n';
      attachments.forEach(att => {
        fullContent += `- ${att.filename || '未知文件'} (${att.contentType || '未知类型'})\n`;
      });
    }
    
    // 生成唯一ID
    const id = generateId();
    const now = new Date().toISOString();
    
    // 邮件来源信息
    const sourceInfo = JSON.stringify({
      from: from,
      subject: subject,
      receivedAt: now,
      hasAttachments: attachments.length > 0,
      attachmentCount: attachments.length
    });
    
    // 基础内容对象
    const contentObj = {
      id,
      original_content: fullContent,
      content_type: 'email',
      source_info: sourceInfo,
      created_at: now,
      updated_at: now,
      last_accessed: now
    };
    
    // AI分析
    if (env.GEMINI_API_KEY) {
      const analysis = await analyzeWithGemini(fullContent, { autoTag: true, deepAnalysis: false }, env.GEMINI_API_KEY);
      
      contentObj.summary = analysis.summary || subject || generateSummary(fullContent);
      contentObj.keywords = JSON.stringify(analysis.keywords || []);
      contentObj.tags = JSON.stringify([...analysis.tags || [], '邮件']);
      contentObj.sentiment = analysis.sentiment || 0;
      contentObj.category = analysis.category || 'email';
      contentObj.importance_score = analysis.importance_score || 0.5;
    } else {
      // 基础分析
      contentObj.summary = subject || generateSummary(fullContent);
      contentObj.keywords = JSON.stringify(extractBasicKeywords(fullContent));
      contentObj.tags = JSON.stringify(['邮件']);
      contentObj.sentiment = 0;
      contentObj.category = 'email';
      contentObj.importance_score = 0.5;
    }
    
    // 计算字数和阅读时间
    contentObj.word_count = fullContent.length;
    contentObj.reading_time = Math.ceil(fullContent.length / 200);
    
    // 保存到数据库
    await saveContent(contentObj, env.DB);
    
    // 更新标签统计
    if (contentObj.tags) {
      const tags = JSON.parse(contentObj.tags);
      await updateTags(tags, env.DB);
    }
    
    // 更新统计
    await updateStats(env.DB);
    
    return jsonResponse({
      success: true,
      data: {
        id: contentObj.id,
        summary: contentObj.summary,
        tags: JSON.parse(contentObj.tags || '[]'),
        sentiment: contentObj.sentiment,
        category: contentObj.category,
        from: from,
        subject: subject
      }
    });
    
  } catch (error) {
    console.error('Email content error:', error);
    return jsonResponse({ error: '邮件处理失败: ' + error.message }, 500);
  }
}

// 获取内容列表处理器
async function handleGetContents(request, env) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';
    
    const offset = (page - 1) * limit;
    
    // 构建查询
    let query = 'SELECT * FROM contents';
    let countQuery = 'SELECT COUNT(*) as total FROM contents';
    const params = [];
    const conditions = [];
    
    if (search) {
      conditions.push('(original_content LIKE ? OR summary LIKE ? OR tags LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    // 执行查询
    const [contents, countResult] = await Promise.all([
      env.DB.prepare(query).bind(...params).all(),
      env.DB.prepare(countQuery).bind(...params.slice(0, -2)).first()
    ]);
    
    const total = countResult.total;
    const hasMore = offset + limit < total;
    
    return jsonResponse({
      success: true,
      data: {
        contents: contents.results || [],
        pagination: {
          page,
          limit,
          total,
          hasMore
        }
      }
    });
    
  } catch (error) {
    console.error('Get contents error:', error);
    return jsonResponse({ error: '获取内容失败: ' + error.message }, 500);
  }
}

// 获取统计数据处理器
async function handleGetStats(request, env) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [totalResult, todayResult, tagsResult, sentimentResult] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as count FROM contents').first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM contents WHERE DATE(created_at) = ?').bind(today).first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM tags').first(),
      env.DB.prepare('SELECT AVG(sentiment) as avg FROM contents WHERE sentiment IS NOT NULL').first()
    ]);
    
    return jsonResponse({
      success: true,
      data: {
        totalContents: totalResult.count || 0,
        todayContents: todayResult.count || 0,
        totalTags: tagsResult.count || 0,
        avgSentiment: sentimentResult.avg || 0
      }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    return jsonResponse({ error: '获取统计失败: ' + error.message }, 500);
  }
}

// URL内容抓取
async function fetchUrlContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InspirationCollector/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // 简单的内容提取（实际项目中可以使用更复杂的解析器）
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // 提取主要文本内容
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // 限制内容长度
    if (content.length > 5000) {
      content = content.substring(0, 5000) + '...';
    }
    
    return {
      title,
      content,
      url,
      extractedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('URL fetch error:', error);
    return {
      title: '',
      content: `无法获取URL内容: ${error.message}`,
      url,
      error: error.message
    };
  }
}

// Gemini AI分析
async function analyzeWithGemini(content, options, apiKey) {
  if (!apiKey) {
    console.warn('Gemini API key not configured');
    return {
      summary: generateSummary(content),
      keywords: [],
      tags: [],
      sentiment: 0,
      category: 'uncategorized',
      importance_score: 0.5
    };
  }
  
  try {
    const prompt = buildAnalysisPrompt(content, options);
    
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    return parseGeminiResponse(result, content);
    
  } catch (error) {
    console.error('Gemini analysis error:', error);
    // 返回基础分析结果作为fallback
    return {
      summary: generateSummary(content),
      keywords: extractBasicKeywords(content),
      tags: ['未分类'],
      sentiment: 0,
      category: 'general',
      importance_score: 0.5
    };
  }
}

// 构建分析提示
function buildAnalysisPrompt(content, options = {}) {
  const { deepAnalysis = false, autoTag = true } = options;
  
  return `请分析以下内容，并以JSON格式返回分析结果：

内容：
${content}

请返回以下格式的JSON：
{
  "summary": "内容摘要（50-100字）",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "tags": ["标签1", "标签2"],
  "sentiment": 0.5,
  "category": "分类",
  "importance_score": 0.8,
  "insights": "深度见解（仅在深度分析时提供）"
}

说明：
- summary: 简洁的内容摘要
- keywords: 3-5个关键词
- tags: 2-4个标签，用于分类管理
- sentiment: 情感分数，-1（负面）到1（正面）
- category: 内容分类（idea/article/quote/todo/learning/tech/business等）
- importance_score: 重要性评分，0-1之间
${deepAnalysis ? '- insights: 提供深度分析和见解' : ''}

请确保返回有效的JSON格式。`;
}

// 解析Gemini响应
function parseGeminiResponse(result, originalContent) {
  try {
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response text from Gemini');
    }
    
    // 尝试提取JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    // 验证和清理数据
    return {
      summary: analysis.summary || generateSummary(originalContent),
      keywords: Array.isArray(analysis.keywords) ? analysis.keywords.slice(0, 5) : [],
      tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 4) : ['未分类'],
      sentiment: typeof analysis.sentiment === 'number' ? 
        Math.max(-1, Math.min(1, analysis.sentiment)) : 0,
      category: analysis.category || 'general',
      importance_score: typeof analysis.importance_score === 'number' ? 
        Math.max(0, Math.min(1, analysis.importance_score)) : 0.5,
      insights: analysis.insights || null
    };
    
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    return {
      summary: generateSummary(originalContent),
      keywords: extractBasicKeywords(originalContent),
      tags: ['未分类'],
      sentiment: 0,
      category: 'general',
      importance_score: 0.5
    };
  }
}

// 基础关键词提取
function extractBasicKeywords(content) {
  const words = content
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1);
  
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

// 数据库操作函数
async function saveContent(content, db) {
  const query = `
    INSERT INTO contents (
      id, original_content, content_type, source_info, summary, keywords, tags,
      sentiment, category, word_count, reading_time, importance_score,
      created_at, updated_at, last_accessed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  return db.prepare(query).bind(
    content.id, content.original_content, content.content_type, content.source_info,
    content.summary, content.keywords, content.tags, content.sentiment, content.category,
    content.word_count, content.reading_time, content.importance_score,
    content.created_at, content.updated_at, content.last_accessed
  ).run();
}

async function updateTags(tags, db) {
  for (const tag of tags) {
    await db.prepare(`
      INSERT INTO tags (id, name, count) VALUES (?, ?, 1)
      ON CONFLICT(name) DO UPDATE SET count = count + 1
    `).bind(generateId(), tag).run();
  }
}

async function updateStats(db) {
  const today = new Date().toISOString().split('T')[0];
  
  await db.prepare(`
    INSERT INTO stats (date, new_contents) VALUES (?, 1)
    ON CONFLICT(date) DO UPDATE SET 
      new_contents = new_contents + 1,
      updated_at = CURRENT_TIMESTAMP
  `).bind(today).run();
}

// 工具函数
function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateSummary(content) {
  // 简单的摘要生成
  const sentences = content.split(/[。！？.!?]/).filter(s => s.trim());
  return sentences[0]?.trim().substring(0, 50) + (sentences[0]?.length > 50 ? '...' : '') || '无标题';
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders()
    }
  });
}

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

// 认证检查函数
async function checkAuthentication(request, env) {
  try {
    // 检查是否配置了登录密钥
    if (!env.LOGIN_KEY) {
      return { success: false, error: '系统未配置登录密钥' };
    }
    
    // 从请求头获取认证信息
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return { success: false, error: '缺少认证信息' };
    }
    
    // 支持 Bearer token 格式
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    // 验证密钥
    if (token !== env.LOGIN_KEY) {
      return { success: false, error: '认证失败，密钥错误' };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: '认证过程出错' };
  }
}

// 其他处理器的占位实现
async function handleGetContent(request, env) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    if (!id) {
      return jsonResponse({ error: '缺少内容ID' }, 400);
    }
    
    const result = await env.DB.prepare(
      'SELECT * FROM contents WHERE id = ?'
    ).bind(id).first();
    
    if (!result) {
      return jsonResponse({ error: '内容不存在' }, 404);
    }
    
    // 更新最后访问时间
    await env.DB.prepare(
      'UPDATE contents SET last_accessed = ? WHERE id = ?'
    ).bind(new Date().toISOString(), id).run();
    
    // 解析JSON字段
    const content = {
      ...result,
      keywords: result.keywords ? JSON.parse(result.keywords) : [],
      tags: result.tags ? JSON.parse(result.tags) : [],
      source_info: result.source_info ? JSON.parse(result.source_info) : null
    };
    
    return jsonResponse({
      success: true,
      data: content
    });
    
  } catch (error) {
    console.error('Get content error:', error);
    return jsonResponse({ error: '获取内容失败: ' + error.message }, 500);
  }
}

async function handleUpdateContent(request, env) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    if (!id) {
      return jsonResponse({ error: '缺少内容ID' }, 400);
    }
    
    const data = await request.json();
    const { summary, tags, category, importance_score } = data;
    
    // 检查内容是否存在
    const existing = await env.DB.prepare(
      'SELECT id FROM contents WHERE id = ?'
    ).bind(id).first();
    
    if (!existing) {
      return jsonResponse({ error: '内容不存在' }, 404);
    }
    
    // 构建更新字段
    const updates = [];
    const values = [];
    
    if (summary !== undefined) {
      updates.push('summary = ?');
      values.push(summary);
    }
    
    if (tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(tags));
    }
    
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    
    if (importance_score !== undefined) {
      updates.push('importance_score = ?');
      values.push(importance_score);
    }
    
    if (updates.length === 0) {
      return jsonResponse({ error: '没有提供要更新的字段' }, 400);
    }
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    const query = `UPDATE contents SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(query).bind(...values).run();
    
    // 如果更新了标签，更新标签统计
    if (tags !== undefined) {
      await updateTags(tags, env.DB);
    }
    
    return jsonResponse({
      success: true,
      message: '内容更新成功'
    });
    
  } catch (error) {
    console.error('Update content error:', error);
    return jsonResponse({ error: '更新内容失败: ' + error.message }, 500);
  }
}

async function handleDeleteContent(request, env) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    if (!id) {
      return jsonResponse({ error: '缺少内容ID' }, 400);
    }
    
    // 检查内容是否存在
    const existing = await env.DB.prepare(
      'SELECT id FROM contents WHERE id = ?'
    ).bind(id).first();
    
    if (!existing) {
      return jsonResponse({ error: '内容不存在' }, 404);
    }
    
    // 删除内容
    await env.DB.prepare(
      'DELETE FROM contents WHERE id = ?'
    ).bind(id).run();
    
    return jsonResponse({
      success: true,
      message: '内容删除成功'
    });
    
  } catch (error) {
    console.error('Delete content error:', error);
    return jsonResponse({ error: '删除内容失败: ' + error.message }, 500);
  }
}

async function handleGetTags(request, env) {
  try {
    const result = await env.DB.prepare('SELECT * FROM tags ORDER BY count DESC LIMIT 50').all();
    return jsonResponse({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

async function handleCreateTag(request, env) {
  try {
    const data = await request.json();
    const { name, description } = data;
    
    if (!name || name.trim().length === 0) {
      return jsonResponse({ error: '标签名称不能为空' }, 400);
    }
    
    const tagName = name.trim();
    const id = generateId();
    
    // 检查标签是否已存在
    const existing = await env.DB.prepare(
      'SELECT id FROM tags WHERE name = ?'
    ).bind(tagName).first();
    
    if (existing) {
      return jsonResponse({ error: '标签已存在' }, 409);
    }
    
    // 创建新标签
    await env.DB.prepare(
      'INSERT INTO tags (id, name, description, count) VALUES (?, ?, ?, 0)'
    ).bind(id, tagName, description || '').run();
    
    return jsonResponse({
      success: true,
      data: {
        id,
        name: tagName,
        description: description || '',
        count: 0
      }
    });
    
  } catch (error) {
    console.error('Create tag error:', error);
    return jsonResponse({ error: '创建标签失败: ' + error.message }, 500);
  }
}

async function handleSearch(request, env) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const category = url.searchParams.get('category');
    const tags = url.searchParams.get('tags');
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    
    if (!query && !category && !tags) {
      return jsonResponse({ error: '请提供搜索条件' }, 400);
    }
    
    let sqlQuery = 'SELECT * FROM contents WHERE 1=1';
    const params = [];
    
    if (query) {
      sqlQuery += ' AND (summary LIKE ? OR original_content LIKE ? OR keywords LIKE ?)';
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (category) {
      sqlQuery += ' AND category = ?';
      params.push(category);
    }
    
    if (tags) {
      sqlQuery += ' AND tags LIKE ?';
      params.push(`%${tags}%`);
    }
    
    sqlQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const result = await env.DB.prepare(sqlQuery).bind(...params).all();
    
    // 解析JSON字段
    const contents = result.results.map(item => ({
      ...item,
      keywords: item.keywords ? JSON.parse(item.keywords) : [],
      tags: item.tags ? JSON.parse(item.tags) : [],
      source_info: item.source_info ? JSON.parse(item.source_info) : null
    }));
    
    return jsonResponse({
      success: true,
      data: contents,
      pagination: {
        limit,
        offset,
        total: contents.length
      }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return jsonResponse({ error: '搜索失败: ' + error.message }, 500);
  }
}

async function handleAnalyzeContent(request, env) {
  try {
    const data = await request.json();
    const { content, deepAnalysis = false } = data;
    
    if (!content || content.trim().length === 0) {
      return jsonResponse({ error: '内容不能为空' }, 400);
    }
    
    if (!env.GEMINI_API_KEY) {
      return jsonResponse({ error: '未配置AI分析服务' }, 503);
    }
    
    // 使用Gemini进行分析
    const analysis = await analyzeWithGemini(
      content.trim(), 
      { autoTag: true, deepAnalysis }, 
      env.GEMINI_API_KEY
    );
    
    return jsonResponse({
      success: true,
      data: {
        summary: analysis.summary || generateSummary(content),
        keywords: analysis.keywords || extractBasicKeywords(content),
        tags: analysis.tags || ['未分类'],
        sentiment: analysis.sentiment || 0,
        category: analysis.category || 'general',
        importance_score: analysis.importance_score || 0.5,
        word_count: content.length,
        reading_time: Math.ceil(content.length / 200)
      }
    });
    
  } catch (error) {
    console.error('Analyze content error:', error);
    return jsonResponse({ error: '分析内容失败: ' + error.message }, 500);
  }
}

async function handleHealthCheck(request, env) {
  return jsonResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
}

async function handleVersion(request, env) {
  return jsonResponse({
    version: '0.1.0',
    name: 'Inspiration Collector API',
    description: '智能灵感收集与知识沉淀平台'
  });
}