/**
 * Illuminateur - 智能内容处理工具
 * 支持文字、URL、图片的OCR、翻译、总结和标记
 */

import { handleRequest } from './handlers/requestHandler.js';
import { handleAuth } from './middleware/auth.js';
import { corsHeaders } from './utils/cors.js';

export default {
  async fetch(request, env, ctx) {
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
      const response = await handleRequest(request, env, ctx);
      
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
      console.error('Worker error:', error);
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
  },

  // 定时任务：每日统计
  async scheduled(event, env, ctx) {
    try {
      const { generateStatistics } = await import('./services/statisticsService.js');
      await generateStatistics(env.DB, 'daily');
      
      // 每周日生成周统计
      const today = new Date();
      if (today.getDay() === 0) { // 周日
        await generateStatistics(env.DB, 'weekly');
      }
      
      console.log('Statistics generated successfully');
    } catch (error) {
      console.error('Scheduled task error:', error);
    }
  }
};