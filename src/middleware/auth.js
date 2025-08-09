/**
 * 身份验证中间件
 */

export async function handleAuth(request, env) {
  try {
    // 从环境变量获取访问令牌
    const validToken = env.ACCESS_TOKEN;
    if (!validToken) {
      return {
        success: false,
        error: 'Access token not configured'
      };
    }

    // 从请求头获取令牌
    const authHeader = request.headers.get('Authorization');
    const accessToken = request.headers.get('X-Access-Token');
    
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (accessToken) {
      token = accessToken;
    }
    
    // 验证令牌
    if (!token || token !== validToken) {
      return {
        success: false,
        error: 'Invalid or missing access token'
      };
    }
    
    return {
      success: true
    };
    
  } catch (error) {
    console.error('Auth error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

export function requireAuth(handler) {
  return async (request, env, ctx) => {
    const authResult = await handleAuth(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return handler(request, env, ctx);
  };
}