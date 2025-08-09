/**
 * 静态文件服务
 * 处理静态资源的服务和响应
 */

// 静态文件内容映射
const STATIC_FILES = {
  'index.html': {
    content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Illuminateur - 智能内容处理工具</title>
    <link rel="stylesheet" href="/style.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💡</text></svg>">
</head>
<body>
    <!-- 头部 -->
    <header class="header">
        <div class="header-content">
            <div class="logo-section">
                <div class="logo">💡</div>
                <div class="title-section">
                    <h1 class="app-title">Illuminateur</h1>
                    <p class="app-subtitle">智能内容处理工具</p>
                </div>
            </div>
            <div class="header-actions">
                <button id="statsBtn" class="header-btn" title="数据统计">
                    <span class="icon">📊</span>
                    <span class="btn-text">统计</span>
                </button>
                <button id="searchBtn" class="header-btn" title="搜索内容">
                    <span class="icon">🔍</span>
                    <span class="btn-text">搜索</span>
                </button>
            </div>
        </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="main-content">
        <!-- 输入区域 -->
        <section class="input-section">
            <div class="input-types">
                <button class="input-type active" data-type="text">
                    <span class="icon">📝</span>
                    <span>文本</span>
                </button>
                <button class="input-type" data-type="url">
                    <span class="icon">🔗</span>
                    <span>URL</span>
                </button>
                <button class="input-type" data-type="image">
                    <span class="icon">🖼️</span>
                    <span>图片</span>
                </button>
            </div>

            <!-- 文本输入 -->
            <div id="textInput" class="input-area">
                <textarea id="textContent" placeholder="请输入要处理的文本内容..." rows="6"></textarea>
            </div>

            <!-- URL输入 -->
            <div id="urlInput" class="input-area hidden">
                <input type="url" id="urlContent" placeholder="请输入网页链接...">
                <div id="urlPreview" class="url-preview"></div>
            </div>

            <!-- 图片输入 -->
            <div id="imageInput" class="input-area hidden">
                <div id="fileUploadArea" class="file-upload-area">
                    <div class="upload-icon">📁</div>
                    <div class="upload-text">
                        <p>点击选择图片或拖拽到此处</p>
                        <p class="upload-hint">支持 JPG、PNG、GIF、WebP 格式，最大 10MB</p>
                    </div>
                    <input type="file" id="imageFile" accept="image/*" hidden>
                </div>
                <div id="imagePreview" class="image-preview"></div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
                <button id="processBtn" class="btn btn-primary">
                    <span class="loading-spinner hidden">⏳</span>
                    <span class="btn-text">开始处理</span>
                </button>
                <button id="clearBtn" class="btn btn-secondary">清空</button>
            </div>
        </section>

        <!-- 结果展示区域 -->
        <section id="resultsSection" class="results-section">
            <div class="results-header">
                <h2>处理结果</h2>
                <div class="results-actions">
                    <button id="exportBtn" class="btn btn-outline" title="导出结果">
                        <span class="icon">💾</span>
                        <span>导出</span>
                    </button>
                    <button id="shareBtn" class="btn btn-outline" title="分享结果">
                        <span class="icon">📤</span>
                        <span>分享</span>
                    </button>
                </div>
            </div>
            <div id="resultsContent" class="results-content"></div>
        </section>
    </main>

    <!-- 侧边栏 -->
    <aside id="sidebar" class="sidebar">
        <!-- 搜索面板 -->
        <div id="searchPanel" class="sidebar-panel">
            <div class="panel-header">
                <h3>内容搜索</h3>
                <button class="panel-close">&times;</button>
            </div>
            <div class="panel-content">
                <form class="search-form">
                    <div class="form-group">
                        <input type="text" id="searchQuery" placeholder="搜索关键词...">
                        <button type="button" id="searchSubmitBtn" class="btn btn-primary">搜索</button>
                    </div>
                    <div class="form-group">
                        <label for="contentTypeFilter">内容类型</label>
                        <select id="contentTypeFilter">
                            <option value="">全部类型</option>
                            <option value="text">文本</option>
                            <option value="url">URL</option>
                            <option value="image">图片</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="dateFromFilter">开始日期</label>
                        <input type="date" id="dateFromFilter">
                    </div>
                    <div class="form-group">
                        <label for="dateToFilter">结束日期</label>
                        <input type="date" id="dateToFilter">
                    </div>
                </form>
                <div id="searchResults" class="search-results"></div>
            </div>
        </div>

        <!-- 统计面板 -->
        <div id="statsPanel" class="sidebar-panel">
            <div class="panel-header">
                <h3>数据统计</h3>
                <button class="panel-close">&times;</button>
            </div>
            <div class="panel-content">
                <div class="stats-controls">
                    <div class="form-group">
                        <label for="statsPeriod">统计周期</label>
                        <select id="statsPeriod">
                            <option value="day">按日</option>
                            <option value="week">按周</option>
                            <option value="month">按月</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="statsDays">天数范围</label>
                        <select id="statsDays">
                            <option value="7">最近7天</option>
                            <option value="30">最近30天</option>
                            <option value="90">最近90天</option>
                        </select>
                    </div>
                    <button id="refreshStatsBtn" class="btn btn-primary">刷新数据</button>
                </div>
                <div id="statsContent" class="stats-content"></div>
            </div>
        </div>
    </aside>

    <!-- 遮罩层 -->
    <div id="overlay" class="overlay"></div>

    <!-- 通用模态框 -->
    <div id="modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modalTitle">标题</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div id="modalBody" class="modal-body"></div>
        </div>
    </div>

    <!-- 登录模态框 -->
    <div id="loginModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>身份验证</h3>
            </div>
            <div class="modal-body">
                <form class="login-form">
                    <div class="form-group">
                        <label for="accessToken">访问令牌</label>
                        <input type="password" id="accessToken" placeholder="请输入访问令牌" required>
                        <div id="loginError" class="error-message"></div>
                    </div>
                    <button type="button" id="loginSubmit" class="btn btn-primary">登录</button>
                </form>
            </div>
        </div>
    </div>

    <!-- 通知容器 -->
    <div id="notifications" class="notifications"></div>

    <script src="/script.js"></script>
</body>
</html>`,
    contentType: 'text/html; charset=utf-8'
  },
  
  'app.html': {
    content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Illuminateur - 应用</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <div id="app">
        <h1>Illuminateur 应用页面</h1>
        <p>这是应用的主页面。</p>
    </div>
    <script src="/script.js"></script>
</body>
</html>`,
    contentType: 'text/html; charset=utf-8'
  }
};

/**
 * 服务静态文件
 * @param {string} filename - 文件名
 * @returns {Response} HTTP响应
 */
export function serveStaticFile(filename) {
  // 检查是否为已知的静态文件
  if (STATIC_FILES[filename]) {
    const file = STATIC_FILES[filename];
    return new Response(file.content, {
      headers: {
        'Content-Type': file.contentType,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  // 处理CSS和JS文件的动态加载
  if (filename === 'style.css') {
    return serveStylesheet();
  }
  
  if (filename === 'script.js') {
    return serveJavaScript();
  }

  // 文件不存在
  return new Response('File not found', { status: 404 });
}

/**
 * 服务CSS样式表
 * @returns {Response} CSS响应
 */
function serveStylesheet() {
  // 这里可以返回内联的CSS或者从其他地方加载
  const css = `
    /* 基础样式 */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    
    .header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding: 1rem 0;
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .logo {
      font-size: 2rem;
    }
    
    .app-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #2d3748;
    }
    
    .app-subtitle {
      font-size: 0.875rem;
      color: #718096;
    }
    
    .main-content {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 2rem;
    }
    
    .input-section {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .hidden {
      display: none !important;
    }
    
    /* 响应式设计 */
    @media (max-width: 768px) {
      .header-content {
        padding: 0 1rem;
        flex-direction: column;
        gap: 1rem;
      }
      
      .main-content {
        padding: 0 1rem;
      }
    }
  `;
  
  return new Response(css, {
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

/**
 * 服务JavaScript文件
 * @returns {Response} JavaScript响应
 */
function serveJavaScript() {
  // 这里可以返回内联的JavaScript或者从其他地方加载
  const js = `
    console.log('Illuminateur 应用已加载');
    
    // 基础应用逻辑
    class IlluminateurApp {
      constructor() {
        this.init();
      }
      
      init() {
        console.log('应用初始化完成');
        this.showWelcomeMessage();
      }
      
      showWelcomeMessage() {
        console.log('欢迎使用 Illuminateur!');
      }
    }
    
    // 初始化应用
    document.addEventListener('DOMContentLoaded', () => {
      new IlluminateurApp();
    });
  `;
  
  return new Response(js, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

/**
 * 获取文件的MIME类型
 * @param {string} filename - 文件名
 * @returns {string} MIME类型
 */
function getMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'html': 'text/html; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'js': 'application/javascript; charset=utf-8',
    'json': 'application/json; charset=utf-8',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 检查文件是否存在
 * @param {string} filename - 文件名
 * @returns {boolean} 文件是否存在
 */
export function fileExists(filename) {
  return STATIC_FILES.hasOwnProperty(filename) || 
         filename === 'style.css' || 
         filename === 'script.js';
}

/**
 * 获取所有可用的静态文件列表
 * @returns {string[]} 文件名列表
 */
export function getAvailableFiles() {
  return [...Object.keys(STATIC_FILES), 'style.css', 'script.js'];
}