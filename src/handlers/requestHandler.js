/**
 * 请求处理器 - 路由分发
 */

import { serveStaticFile } from '../services/staticService.js';
import { processContent } from '../services/contentService.js';
import { getStatistics } from '../services/statisticsService.js';
import { searchContents, getContentById } from '../services/searchService.js';

export async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    // 静态文件和页面路由
    if (method === 'GET') {
      switch (path) {
        case '/':
        case '/login':
          return serveStaticFile('index.html');
        case '/app':
          return serveStaticFile('app.html');
        case '/style.css':
          return serveStaticFile('style.css');
        case '/script.js':
          return serveStaticFile('script.js');
      }
    }

    // API 路由
    if (path.startsWith('/api/')) {
      switch (path) {
        case '/api/process':
          if (method === 'POST') {
            return await handleProcessContent(request, env);
          } else {
            return new Response(JSON.stringify({ 
              error: 'Method not allowed',
              allowed: ['POST'],
              received: method
            }), {
              status: 405,
              headers: { 
                'Content-Type': 'application/json',
                'Allow': 'POST'
              }
            });
          }
          
        case '/api/search':
          if (method === 'GET') {
            return await handleSearch(request, env);
          } else {
            return new Response(JSON.stringify({ 
              error: 'Method not allowed',
              allowed: ['GET'],
              received: method
            }), {
              status: 405,
              headers: { 
                'Content-Type': 'application/json',
                'Allow': 'GET'
              }
            });
          }
          
        case '/api/content':
          if (method === 'GET') {
            return await handleGetContent(request, env);
          } else {
            return new Response(JSON.stringify({ 
              error: 'Method not allowed',
              allowed: ['GET'],
              received: method
            }), {
              status: 405,
              headers: { 
                'Content-Type': 'application/json',
                'Allow': 'GET'
              }
            });
          }
          
        case '/api/statistics':
          if (method === 'GET') {
            return await handleGetStatistics(request, env);
          } else {
            return new Response(JSON.stringify({ 
              error: 'Method not allowed',
              allowed: ['GET'],
              received: method
            }), {
              status: 405,
              headers: { 
                'Content-Type': 'application/json',
                'Allow': 'GET'
              }
            });
          }
          
        case '/api/health':
          if (method === 'GET') {
            return new Response(JSON.stringify({ 
              status: 'ok', 
              timestamp: new Date().toISOString() 
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          } else {
            return new Response(JSON.stringify({ 
              error: 'Method not allowed',
              allowed: ['GET'],
              received: method
            }), {
              status: 405,
              headers: { 
                'Content-Type': 'application/json',
                'Allow': 'GET'
              }
            });
          }
          
        default:
          return new Response(JSON.stringify({ 
            error: 'API endpoint not found',
            path: path
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    }

    // 404 处理
    return new Response('Not Found', { status: 404 });
    
  } catch (error) {
    console.error('Request handler error:', error);
    return new Response(JSON.stringify({ 
      error: 'Request processing failed',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 处理内容处理请求
async function handleProcessContent(request, env) {
  try {
    const formData = await request.formData();
    const contentType = formData.get('type'); // 'text', 'url', 'image'
    
    // 根据类型获取不同的字段
    let content;
    if (contentType === 'url') {
      content = formData.get('url') || formData.get('content');
    } else if (contentType === 'text') {
      content = formData.get('text') || formData.get('content');
    } else {
      content = formData.get('content');
    }
    
    const file = formData.get('file');
    
    if (!contentType || (!content && !file)) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters',
        details: `Type: ${contentType}, Content: ${content ? 'present' : 'missing'}, File: ${file ? 'present' : 'missing'}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await processContent({
      type: contentType,
      content: content,
      file: file
    }, env);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Process content error:', error);
    return new Response(JSON.stringify({ 
      error: 'Content processing failed',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 处理搜索请求
async function handleSearch(request, env) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    
    const results = await searchContents(env.DB, query, limit, offset);
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ 
      error: 'Search failed',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 处理获取内容详情请求
async function handleGetContent(request, env) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'Missing content ID' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const content = await getContentById(env.DB, id);
    
    if (!content) {
      return new Response(JSON.stringify({ 
        error: 'Content not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(content), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get content error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get content',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 处理获取统计信息请求
async function handleGetStatistics(request, env) {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'daily';
    const days = parseInt(url.searchParams.get('days')) || 7;
    
    const stats = await getStatistics(env.DB, period, days);
    
    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get statistics error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get statistics',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}