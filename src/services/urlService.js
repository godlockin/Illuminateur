/**
 * URL处理服务 - 网页内容抓取和解析
 */

/**
 * 从URL提取文本内容
 * @param {string} url - 目标URL
 * @returns {Object} 提取结果
 */
export async function extractTextFromUrl(url) {
  try {
    // 验证URL格式
    const urlObj = new URL(url);
    
    // 设置请求头，模拟浏览器访问
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
    
    console.log('Fetching URL:', url);
    
    // 获取网页内容
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      // 设置超时时间
      signal: AbortSignal.timeout(30000) // 30秒超时
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    // 检查内容类型
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
    
    const html = await response.text();
    console.log('HTML content length:', html.length);
    
    // 解析HTML并提取文本
    const extractedData = parseHtmlContent(html, url);
    
    return {
      success: true,
      url: url,
      title: extractedData.title,
      text: extractedData.text,
      images: extractedData.images,
      metadata: extractedData.metadata
    };
    
  } catch (error) {
    console.error('URL extraction error:', error);
    return {
      success: false,
      url: url,
      error: error.message,
      text: '',
      images: [],
      metadata: {}
    };
  }
}

/**
 * 解析HTML内容
 * @param {string} html - HTML内容
 * @param {string} baseUrl - 基础URL
 * @returns {Object} 解析结果
 */
function parseHtmlContent(html, baseUrl) {
  // 简单的HTML解析（在生产环境中建议使用更强大的HTML解析器）
  const result = {
    title: '',
    text: '',
    images: [],
    metadata: {}
  };
  
  try {
    // 提取标题
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      result.title = decodeHtmlEntities(titleMatch[1].trim());
    }
    
    // 提取meta描述
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaDescMatch) {
      result.metadata.description = decodeHtmlEntities(metaDescMatch[1]);
    }
    
    // 提取meta关键词
    const metaKeywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    if (metaKeywordsMatch) {
      result.metadata.keywords = decodeHtmlEntities(metaKeywordsMatch[1]);
    }
    
    // 移除脚本和样式标签
    let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    cleanHtml = cleanHtml.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
    
    // 提取主要内容区域
    const contentSelectors = [
      /<article[^>]*>([\s\S]*?)<\/article>/gi,
      /<main[^>]*>([\s\S]*?)<\/main>/gi,
      /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class=["'][^"']*post[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi
    ];
    
    let mainContent = '';
    for (const selector of contentSelectors) {
      const matches = cleanHtml.match(selector);
      if (matches && matches.length > 0) {
        mainContent = matches.join(' ');
        break;
      }
    }
    
    // 如果没有找到主要内容区域，使用body内容
    if (!mainContent) {
      const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        mainContent = bodyMatch[1];
      } else {
        mainContent = cleanHtml;
      }
    }
    
    // 提取文本内容
    result.text = extractTextFromHtml(mainContent);
    
    // 提取图片URL
    result.images = extractImageUrls(html, baseUrl);
    
    return result;
    
  } catch (error) {
    console.error('HTML parsing error:', error);
    // 如果解析失败，尝试简单的文本提取
    result.text = extractTextFromHtml(html);
    return result;
  }
}

/**
 * 从HTML中提取纯文本
 * @param {string} html - HTML内容
 * @returns {string} 纯文本
 */
function extractTextFromHtml(html) {
  // 移除HTML标签
  let text = html.replace(/<[^>]+>/g, ' ');
  
  // 解码HTML实体
  text = decodeHtmlEntities(text);
  
  // 清理空白字符
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n');
  
  return text.trim();
}

/**
 * 提取图片URL
 * @param {string} html - HTML内容
 * @param {string} baseUrl - 基础URL
 * @returns {Array} 图片URL数组
 */
function extractImageUrls(html, baseUrl) {
  const images = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    let imgUrl = match[1];
    
    // 处理相对URL
    if (imgUrl.startsWith('//')) {
      imgUrl = 'https:' + imgUrl;
    } else if (imgUrl.startsWith('/')) {
      const urlObj = new URL(baseUrl);
      imgUrl = urlObj.origin + imgUrl;
    } else if (!imgUrl.startsWith('http')) {
      try {
        imgUrl = new URL(imgUrl, baseUrl).href;
      } catch (e) {
        continue; // 跳过无效的URL
      }
    }
    
    // 过滤掉一些常见的无用图片
    if (!imgUrl.includes('pixel') && 
        !imgUrl.includes('tracking') && 
        !imgUrl.includes('analytics') &&
        !imgUrl.endsWith('.gif')) {
      images.push(imgUrl);
    }
  }
  
  return [...new Set(images)]; // 去重
}

/**
 * 解码HTML实体
 * @param {string} text - 包含HTML实体的文本
 * @returns {string} 解码后的文本
 */
function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™'
  };
  
  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    return entities[entity] || entity;
  });
}

/**
 * 批量处理URL
 * @param {Array} urls - URL数组
 * @returns {Array} 处理结果数组
 */
export async function batchExtractFromUrls(urls) {
  const results = [];
  
  for (const url of urls) {
    try {
      const result = await extractTextFromUrl(url);
      results.push(result);
      
      // 添加延迟以避免过于频繁的请求
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Batch URL processing error for ${url}:`, error);
      results.push({
        success: false,
        url: url,
        error: error.message,
        text: '',
        images: [],
        metadata: {}
      });
    }
  }
  
  return results;
}