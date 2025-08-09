/**
 * Cloudflare Pages Functions - 动态路由处理
 * 处理所有API和动态路由请求
 */

import { handleRequest } from '../src/handlers/requestHandler.js';
import { handleAuth } from '../src/middleware/auth.js';
import { corsHeaders } from '../src/utils/cors.js';

export async function onRequest(context) {
  const { request, env } = context;
  
  try {
    // 处理CORS预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    // 验证访问令牌（除了登录页面和静态资源）
    const url = new URL(request.url);
    const isStaticResource = url.pathname === '/' || 
                            url.pathname === '/login' || 
                            url.pathname === '/app' ||
                            url.pathname === '/style.css' ||
                            url.pathname === '/script.js' ||
                            url.pathname.startsWith('/assets/') ||
                            url.pathname === '/api/health';
    
    if (!isStaticResource) {
      const authResult = await handleAuth(request, env);
      if (!authResult.success) {
        return new Response(JSON.stringify({ error: authResult.error }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }

    // 处理请求
    const response = await handleRequest(request, env, context);
    
    // 添加CORS头
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
    
  } catch (error) {
    console.error('Pages Function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}