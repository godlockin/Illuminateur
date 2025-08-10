/**
 * Illuminateur - Personal Information Capture and Analysis Tool
 * Cloudflare Worker Implementation
 */

// HTML content for the frontend
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Illuminateur - Insight Collector</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        // Load recent inputs
        async function loadRecentInputs() {
            if (!accessToken) {
                showStatus('需要身份验证', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/recent-inputs', {
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    }
                });
                
                if (!response.ok) {
                    throw new Error('加载最近输入数据失败');
                }
                
                const inputs = await response.json();
                const inputsList = document.getElementById('recent-inputs-list');
                
                if (inputs.length === 0) {
                    inputsList.innerHTML = '<p>暂无最近输入的数据。</p>';
                } else {
                    inputsList.innerHTML = inputs.map(input => 
                        '<div class="insight-item" style="border-left: 4px solid #007bff;">' +
                            '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">' +
                                '<div>' +
                                    '<div class="insight-date">' + new Date(input.created_at).toLocaleString('zh-CN') + '</div>' +
                                    '<div style="font-size: 0.9rem; color: #666; margin-bottom: 0.5rem;">类型: ' + (input.type === 'text' ? '文本' : input.type === 'url' ? 'URL' : '图片') + '</div>' +
                                '</div>' +
                                '<div>' +
                                    '<button class="btn" onclick="editInput(\'' + input.id + '\')" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; margin-right: 0.3rem;">✏️ 编辑</button>' +
                                    '<button class="btn" onclick="deleteInput(\'' + input.id + '\')" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background-color: #dc3545; border-color: #dc3545;">🗑️ 删除</button>' +
                                '</div>' +
                            '</div>' +
                            '<div class="insight-text" style="font-size: 0.9rem;">' + 
                                (input.type === 'text' ? input.original_content.substring(0, 100) + (input.original_content.length > 100 ? '...' : '') :
                                 input.type === 'url' ? input.original_content :
                                 '图片文件: ' + input.r2_object_key.split('/').pop()) +
                            '</div>' +
                            (input.analysis_result ? '<div style="margin-top: 0.5rem; padding: 0.5rem; background-color: #f8f9fa; border-radius: 4px; font-size: 0.85rem;"><strong>分析结果:</strong> ' + JSON.stringify(input.analysis_result).substring(0, 150) + '...</div>' : '') +
                        '</div>'
                    ).join('');
                }
            } catch (error) {
                showStatus('加载最近输入数据时出错: ' + error.message, 'error');
            }
        }
        
        // Edit input
        async function editInput(inputId) {
            // For now, just show an alert - can be enhanced later
            alert('编辑功能正在开发中，输入ID: ' + inputId);
        }
        
        // Delete input
        async function deleteInput(inputId) {
            if (!confirm('确定要删除这条输入数据吗？此操作不可撤销。')) {
                return;
            }
            
            if (!accessToken) {
                showStatus('需要身份验证', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/delete-input/' + inputId, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    }
                });
                
                if (!response.ok) {
                    throw new Error('删除输入数据失败');
                }
                
                showStatus('输入数据已删除', 'success');
                loadRecentInputs(); // Reload the list
            } catch (error) {
                showStatus('删除输入数据时出错: ' + error.message, 'error');
            }
        }
        
        // Generate insight manually
        async function generateInsightManually() {
            if (!accessToken) {
                showStatus('需要身份验证', 'error');
                return;
            }
            
            if (!confirm('确定要手动生成洞察吗？这将基于您最近的输入数据生成新的洞察。')) {
                return;
            }
            
            try {
                showStatus('正在生成洞察，请稍候...', 'info');
                
                const response = await fetch('/api/generate-insight', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    }
                });
                
                if (!response.ok) {
                    throw new Error('生成洞察失败');
                }
                
                const result = await response.json();
                showStatus('洞察生成成功！', 'success');
                loadInsights(); // Reload insights
            } catch (error) {
                showStatus('生成洞察时出错: ' + error.message, 'error');
            }
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 90%;
            max-width: 600px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            opacity: 0.9;
        }
        
        .auth-gate {
            padding: 2rem;
            text-align: center;
        }
        
        .auth-gate h2 {
            color: #333;
            margin-bottom: 1rem;
        }
        
        .auth-gate p {
            color: #666;
            margin-bottom: 2rem;
        }
        
        .tabs {
            display: flex;
            background: #f8f9fa;
        }
        
        .tab {
            flex: 1;
            padding: 1rem;
            text-align: center;
            cursor: pointer;
            border: none;
            background: transparent;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        .tab.active {
            background: white;
            color: #4facfe;
            font-weight: 600;
        }
        
        .tab-content {
            padding: 2rem;
            min-height: 400px;
        }
        
        .tab-pane {
            display: none;
        }
        
        .tab-pane.active {
            display: block;
        }
        
        .auth-section {
            margin-bottom: 2rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 10px;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #333;
        }
        
        input, textarea, select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }
        
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #4facfe;
        }
        
        textarea {
            resize: vertical;
            min-height: 120px;
        }
        
        .file-input {
            border: 2px dashed #4facfe;
            padding: 2rem;
            text-align: center;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .file-input:hover {
            background: #f8f9ff;
        }
        
        .btn {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .status {
            margin-top: 1rem;
            padding: 1rem;
            border-radius: 8px;
            display: none;
        }
        
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .status.info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .insights-list {
            space-y: 1rem;
        }
        
        .insight-item {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 10px;
            margin-bottom: 1rem;
            border-left: 4px solid #4facfe;
        }
        
        .insight-date {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 0.5rem;
        }
        
        .insight-text {
            line-height: 1.6;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #4facfe;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Illuminateur</h1>
            <p>Personal Insight Collector & Analyzer</p>
        </div>
        
        <!-- Authentication Gate -->
        <div id="auth-gate" class="auth-gate">
            <h2>🔒 需要身份验证</h2>
            <p>请输入您的访问令牌以继续使用</p>
            <div class="form-group">
                <input type="password" id="access-token-gate" placeholder="请输入访问令牌">
                <button class="btn" onclick="authenticateUser()" style="margin-top: 1rem;">验证身份</button>
            </div>
            <div id="auth-status" class="status"></div>
        </div>
        
        <!-- Main Application -->
        <div id="main-app" class="hidden">
            <div class="tabs">
                <button class="tab active" onclick="switchTab('capture')">捕获</button>
                <button class="tab" onclick="switchTab('insights')">洞察</button>
            </div>
            
            <div class="tab-content">
                <!-- Capture Tab -->
                <div id="capture-tab" class="tab-pane active">
                    <form id="capture-form">
                        <div class="form-group">
                            <label for="input-type">输入类型:</label>
                            <select id="input-type" onchange="toggleInputMethod()">
                                <option value="text">文本</option>
                                <option value="url">URL 链接</option>
                                <option value="image">图片</option>
                            </select>
                        </div>
                        
                        <div id="text-input" class="form-group">
                            <label for="text-content">文本内容:</label>
                            <textarea id="text-content" placeholder="请输入您的文本内容..."></textarea>
                        </div>
                        
                        <div id="url-input" class="form-group" style="display: none;">
                            <label for="url-content">URL 链接:</label>
                            <input type="url" id="url-content" placeholder="https://example.com">
                        </div>
                        
                        <div id="image-input" class="form-group" style="display: none;">
                            <label>图片文件:</label>
                            <div class="file-input" onclick="document.getElementById('image-file').click()">
                                <input type="file" id="image-file" accept="image/*" style="display: none;" onchange="updateFileName()">
                                <div id="file-text">📁 点击选择图片文件</div>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn" id="submit-btn">
                            <span id="submit-text">分析并存储</span>
                            <span id="submit-loading" class="loading" style="display: none;"></span>
                        </button>
                    </form>
                    
                    <div id="status" class="status"></div>
                    
                    <!-- Recent Inputs Section -->
                    <div style="margin-top: 3rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3>最近输入的数据</h3>
                            <button class="btn" onclick="loadRecentInputs()" style="padding: 0.5rem 1rem; font-size: 0.9rem;">🔄 刷新</button>
                        </div>
                        <div id="recent-inputs-list">
                            <p>点击刷新按钮加载最近的输入数据...</p>
                        </div>
                    </div>
                </div>
                
                <!-- Insights Tab -->
                <div id="insights-tab" class="tab-pane">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h2>洞察</h2>
                        <div>
                            <button class="btn" onclick="generateInsightManually()" style="margin-right: 0.5rem;">✨ 手动生成洞察</button>
                            <button class="btn" onclick="loadInsights()">🔄 刷新</button>
                        </div>
                    </div>
                    <div id="insights-list" class="insights-list">
                        <p>点击刷新按钮加载您的洞察...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let accessToken = '';
        
        function authenticateUser() {
            const token = document.getElementById('access-token-gate').value;
            if (!token) {
                showAuthStatus('请输入访问令牌', 'error');
                return;
            }
            
            // Test the token by making a simple API call
            fetch('/api/test', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => {
                if (response.ok) {
                    accessToken = token;
                    document.getElementById('auth-gate').classList.add('hidden');
                    document.getElementById('main-app').classList.remove('hidden');
                    showAuthStatus('认证成功！', 'success');
                } else {
                    showAuthStatus('访问令牌无效', 'error');
                }
            })
            .catch(error => {
                showAuthStatus('认证失败，请重试', 'error');
            });
        }
        
        function showAuthStatus(message, type) {
            const status = document.getElementById('auth-status');
            status.textContent = message;
            status.className = 'status ' + type;
            status.style.display = 'block';
            
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        }
        
        function switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            event.target.classList.add('active');
            
            // Update tab content
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            document.getElementById(tabName + '-tab').classList.add('active');
            
            // Load insights when switching to insights tab
            if (tabName === 'insights') {
                loadInsights();
            }
        }
        
        function toggleInputMethod() {
            const inputType = document.getElementById('input-type').value;
            
            // Hide all input methods
            document.getElementById('text-input').style.display = 'none';
            document.getElementById('url-input').style.display = 'none';
            document.getElementById('image-input').style.display = 'none';
            
            // Show selected input method
            document.getElementById(inputType + '-input').style.display = 'block';
        }
        
        function updateFileName() {
            const fileInput = document.getElementById('image-file');
            const fileText = document.getElementById('file-text');
            
            if (fileInput.files.length > 0) {
                fileText.textContent = '📁 ' + fileInput.files[0].name;
            } else {
                fileText.textContent = '📁 点击选择图片文件';
            }
        }
        
        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = 'status ' + type;
            status.style.display = 'block';
            
            setTimeout(() => {
                status.style.display = 'none';
            }, 5000);
        }
        
        function setLoading(loading) {
            const submitBtn = document.getElementById('submit-btn');
            const submitText = document.getElementById('submit-text');
            const submitLoading = document.getElementById('submit-loading');
            
            submitBtn.disabled = loading;
            submitText.style.display = loading ? 'none' : 'inline';
            submitLoading.style.display = loading ? 'inline-block' : 'none';
            
            if (loading) {
                showStatus('正在处理中...', 'info');
            }
        }
        
        async function loadInsights() {
            if (!accessToken) {
                showStatus('需要身份验证', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/insights', {
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    }
                });
                
                if (!response.ok) {
                    throw new Error('加载洞察失败');
                }
                
                const insights = await response.json();
                const insightsList = document.getElementById('insights-list');
                
                if (insights.length === 0) {
                    insightsList.innerHTML = '<p>暂无每周洞察。请在周日后查看！</p>';
                } else {
                    insightsList.innerHTML = insights.map(insight => 
                        '<div class="insight-item">' +
                            '<div class="insight-date">' + insight.week_start_date + ' 开始的一周</div>' +
                            '<div class="insight-text">' + insight.insight_text + '</div>' +
                        '</div>'
                    ).join('');
                }
            } catch (error) {
                showStatus('加载洞察时出错: ' + error.message, 'error');
            }
        }
        
        document.getElementById('capture-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!accessToken) {
                showStatus('需要身份验证', 'error');
                return;
            }
            
            const inputType = document.getElementById('input-type').value;
            let formData = new FormData();
            
            formData.append('type', inputType);
            
            if (inputType === 'text') {
                const textContent = document.getElementById('text-content').value;
                if (!textContent.trim()) {
                    showStatus('请输入一些文本', 'error');
                    return;
                }
                formData.append('content', textContent);
            } else if (inputType === 'url') {
                const urlContent = document.getElementById('url-content').value;
                if (!urlContent.trim()) {
                    showStatus('请输入一个URL', 'error');
                    return;
                }
                formData.append('content', urlContent);
            } else if (inputType === 'image') {
                const imageFile = document.getElementById('image-file').files[0];
                if (!imageFile) {
                    showStatus('请选择一个图片文件', 'error');
                    return;
                }
                formData.append('file', imageFile);
            }
            
            setLoading(true);
            
            try {
                const response = await fetch('/api/capture', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(error || '处理输入失败');
                }
                
                const result = await response.json();
                showStatus('成功处理并分析了您的输入！', 'success');
                
                // Clear form
                document.getElementById('capture-form').reset();
                toggleInputMethod();
                updateFileName();
                
            } catch (error) {
                showStatus('错误: ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        });
    </script>
</body>
</html>`;

// Worker 对象
const worker = {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // Serve frontend HTML for root path
        if (url.pathname === '/') {
            return new Response(HTML_CONTENT, {
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        // API routes
        if (url.pathname.startsWith('/api/')) {
            return handleAPI(request, env, url);
        }
        
        return new Response('Not Found', { status: 404 });
    },
    
    // Cron trigger for weekly insights
    async scheduled(event, env, ctx) {
        ctx.waitUntil(generateWeeklyInsight(env));
    }
};

// 导出 Worker
export default worker;

/**
 * Authentication middleware
 */
function authenticate(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    
    const token = authHeader.substring(7);
    return token === env.ACCESS_TOKEN;
}

/**
 * Handle API requests
 */
async function handleAPI(request, env, url) {
    // Authentication check
    if (!authenticate(request, env)) {
        return new Response('Unauthorized', { status: 401 });
    }
    
    try {
        if (url.pathname === '/api/test' && request.method === 'GET') {
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (url.pathname === '/api/capture' && request.method === 'POST') {
            return await handleCapture(request, env);
        }
        
        if (url.pathname === '/api/insights' && request.method === 'GET') {
            return await handleGetInsights(request, env);
        }
        
        if (url.pathname === '/api/recent-inputs' && request.method === 'GET') {
            return await handleGetRecentInputs(request, env);
        }
        
        if (url.pathname.startsWith('/api/delete-input/') && request.method === 'DELETE') {
            const inputId = url.pathname.split('/').pop();
            return await handleDeleteInput(inputId, env);
        }
        
        if (url.pathname === '/api/generate-insight' && request.method === 'POST') {
            return await handleGenerateInsight(request, env);
        }
        
        return new Response('Not Found', { status: 404 });
    } catch (error) {
        console.error('API Error:', error);
        return new Response('Internal Server Error: ' + error.message, { status: 500 });
    }
}

/**
 * Handle content capture and analysis
 */
async function handleCapture(request, env) {
    const formData = await request.formData();
    const type = formData.get('type');
    
    let content, r2ObjectKey, originalContent;
    
    // Generate unique object key
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    
    if (type === 'text') {
        content = formData.get('content');
        originalContent = content;
        r2ObjectKey = `text/${timestamp}-${randomId}.txt`;
        
        // Store text in R2
        await env.R2_BUCKET.put(r2ObjectKey, content);
        
    } else if (type === 'url') {
        const url = formData.get('content');
        originalContent = url;
        r2ObjectKey = `html/${timestamp}-${randomId}.html`;
        
        // Fetch and store HTML
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status}`);
        }
        
        const html = await response.text();
        await env.R2_BUCKET.put(r2ObjectKey, html);
        
        // Extract text content from HTML
        content = extractTextFromHTML(html);
        
    } else if (type === 'image') {
        const file = formData.get('file');
        originalContent = file.name;
        r2ObjectKey = `images/${timestamp}-${randomId}-${file.name}`;
        
        // Store image in R2
        await env.R2_BUCKET.put(r2ObjectKey, file.stream());
        
        // For image analysis, we'll pass the image data to LLM
        content = await file.arrayBuffer();
        
    } else {
        throw new Error('Invalid input type');
    }
    
    // Store input record in D1
    const inputResult = await env.D1_DB.prepare(
        'INSERT INTO inputs (type, r2_object_key, original_content) VALUES (?, ?, ?) RETURNING id'
    ).bind(type, r2ObjectKey, originalContent).first();
    
    const inputId = inputResult.id;
    
    // Analyze content with LLM
    const analysis = await analyzeWithLLM(content, type, env);
    
    // Store LLM output in D1
    await env.D1_DB.prepare(
        'INSERT INTO llm_outputs (input_id, summary, keywords, extracted_tables) VALUES (?, ?, ?, ?)'
    ).bind(
        inputId,
        analysis.summary,
        JSON.stringify(analysis.keywords),
        analysis.extractedTables ? JSON.stringify(analysis.extractedTables) : null
    ).run();
    
    return new Response(JSON.stringify({
        success: true,
        inputId,
        analysis
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * Get weekly insights
 */
async function handleGetInsights(request, env) {
    const insights = await env.D1_DB.prepare(
        'SELECT * FROM weekly_insights ORDER BY created_at DESC'
    ).all();
    
    return new Response(JSON.stringify(insights.results), {
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * Extract text content from HTML
 */
function extractTextFromHTML(html) {
    // Simple HTML text extraction (in production, consider using a proper HTML parser)
    let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
        .replace(/<[^>]*>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    
    // Extract tables separately (basic implementation)
    const tableMatches = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
    const tables = tableMatches ? tableMatches.map(table => {
        return table.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }) : [];
    
    return { text, tables };
}

/**
 * Universal AI API caller supporting multiple providers
 */
async function callAIAPI(prompt, env, imageData = null) {
    // 配置参数
    const apiKey = env.AI_API_KEY || env.GEMINI_API_KEY;
    const model = env.AI_MODEL || env.GEMINI_MODEL || 'gemini-2.5-flash';
    const baseUrl = env.AI_BASE_URL || 'https://generativelanguage.googleapis.com';
    const provider = env.AI_PROVIDER || 'gemini'; // gemini, openai, etc.
    
    if (!apiKey) {
        throw new Error('AI_API_KEY or GEMINI_API_KEY not found in environment variables');
    }
    
    try {
        if (provider === 'openai') {
            return await callOpenAIAPI(prompt, apiKey, model, baseUrl, imageData);
        } else {
            // Default to Gemini
            return await callGeminiAPI(prompt, apiKey, model, baseUrl, imageData);
        }
    } catch (error) {
        console.error('AI API call failed:', error);
        throw error;
    }
}

/**
 * Call OpenAI-compatible API
 */
async function callOpenAIAPI(prompt, apiKey, model, baseUrl, imageData = null) {
    const url = `${baseUrl}/v1/chat/completions`;
    
    const messages = [];
    
    if (imageData) {
        // OpenAI vision format
        messages.push({
            role: "user",
            content: [
                { type: "text", text: prompt },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/jpeg;base64,${btoa(String.fromCharCode(...new Uint8Array(imageData)))}`
                    }
                }
            ]
        });
    } else {
        messages.push({
            role: "user",
            content: prompt
        });
    }
    
    const requestBody = {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    const responseData = await response.json();
    
    if (responseData.choices && responseData.choices[0] && responseData.choices[0].message) {
        return responseData.choices[0].message.content;
    }
    
    return 'No response generated';
}

/**
 * Call Gemini API (non-streaming for better reliability)
 */
async function callGeminiAPI(prompt, apiKey, model, baseUrl, imageData = null) {
    const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const parts = [{ text: prompt }];
    
    if (imageData) {
        parts.push({
            inline_data: {
                mime_type: "image/jpeg",
                data: btoa(String.fromCharCode(...new Uint8Array(imageData)))
            }
        });
    }
    
    const requestBody = {
        contents: [{ parts: parts }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
        }
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const responseData = await response.json();
    
    if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content) {
        const parts = responseData.candidates[0].content.parts;
        if (parts && parts[0] && parts[0].text) {
            return parts[0].text;
        }
    }
    
    return 'No response generated';
}

/**
 * Analyze content with LLM (supports multiple AI providers)
 */
async function analyzeWithLLM(content, type, env) {
    let generatedText = '';

    if (type === 'image') {
        // --- IMAGE ANALYSIS PATH ---
        const prompt = `分析这张图片并提供以下信息：
1. 简洁的图片描述（1-2句话）
2. 1-5个相关关键词

请以JSON格式回复：{"summary": "描述", "keywords": ["关键词1", "关键词2"]}`;

        generatedText = await callAIAPI(prompt, env, content);

    } else {
        // --- TEXT/URL ANALYSIS PATH ---
        const textContent = typeof content === 'object' ? content.text : content;
        const tables = typeof content === 'object' && Array.isArray(content.tables) ? content.tables : [];

        // [SIMPLIFIED PROMPT FOR TEXT/URL]
        const prompt = `分析以下内容并提供：
1. 简洁摘要（2-3句话）
2. 1-5个关键词
3. 如果有表格数据，提取关键信息

内容：${textContent}

${tables.length > 0 ? `表格数据：${tables.join('\n\n')}` : ''}

请以JSON格式回复：{"summary": "摘要", "keywords": ["关键词"], "extractedTables": ["表格信息"]}`;
        
        generatedText = await callAIAPI(prompt, env);
    }

    try {
        // Clean the response to remove potential markdown wrappers
        let cleanText = generatedText.replace(/^```json\s*|```\s*$/g, '').trim();
        
        // Try to extract JSON from the response if it's embedded in other text
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        }
        
        const analysis = JSON.parse(cleanText);
        return {
            summary: analysis.summary || 'No summary provided',
            keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
            extractedTables: Array.isArray(analysis.extractedTables) ? analysis.extractedTables : []
        };
    } catch (e) {
        console.error("Failed to parse JSON from LLM response:", generatedText);
        
        // Try to extract useful information even if JSON parsing fails
        const lines = generatedText.split('\n').filter(line => line.trim());
        const summary = lines.length > 0 ? lines[0].substring(0, 200) : 'Analysis completed';
        
        return {
            summary: summary,
            keywords: ['content', 'analysis'],
            extractedTables: []
        };
    }
}

/**
 * Generate weekly insight (cron job)
 */
async function generateWeeklyInsight(env) {
    try {
        // Calculate week start date (last Sunday)
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekStartStr = weekStart.toISOString().split('T')[0];
        
        // Check if insight already exists for this week
        const existingInsight = await env.D1_DB.prepare(
            'SELECT id FROM weekly_insights WHERE week_start_date = ?'
        ).bind(weekStartStr).first();
        
        if (existingInsight) {
            console.log('Weekly insight already exists for', weekStartStr);
            return;
        }
        
        // Get all summaries from the past week
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        const summaries = await env.D1_DB.prepare(`
            SELECT lo.summary, lo.keywords 
            FROM llm_outputs lo 
            JOIN inputs i ON lo.input_id = i.id 
            WHERE i.created_at >= ? AND i.created_at < ?
        `).bind(weekStart.toISOString(), weekEnd.toISOString()).all();
        
        if (summaries.results.length === 0) {
            console.log('No content to analyze for week', weekStartStr);
            return;
        }
        
        // Combine all summaries
        const combinedContent = summaries.results.map(s => s.summary).join('\n\n');
        
        // Generate weekly insight
        const prompt = `Based on the following weekly inputs, what is the single most valuable or surprising insight? Synthesize a new, original viewpoint that connects the themes. Be concise but profound.\n\nWeekly content summaries:\n${combinedContent}`;
        
        const insightText = await callAIAPI(prompt, env);
        
        // Store weekly insight
        await env.D1_DB.prepare(
            'INSERT INTO weekly_insights (insight_text, week_start_date) VALUES (?, ?)'
        ).bind(insightText, weekStartStr).run();
        
        console.log('Generated weekly insight for', weekStartStr);
        
    } catch (error) {
        console.error('Error generating weekly insight:', error);
    }
}

/**
 * Get recent inputs
 */
async function handleGetRecentInputs(request, env) {
    try {
        const inputs = await env.D1_DB.prepare(`
            SELECT i.id, i.type, i.r2_object_key, i.original_content, i.created_at,
                   lo.summary, lo.keywords, lo.extracted_tables
            FROM inputs i
            LEFT JOIN llm_outputs lo ON i.id = lo.input_id
            ORDER BY i.created_at DESC
            LIMIT 20
        `).all();
        
        const results = inputs.results.map(input => ({
            id: input.id,
            type: input.type,
            r2_object_key: input.r2_object_key,
            original_content: input.original_content,
            created_at: input.created_at,
            analysis_result: {
                summary: input.summary,
                keywords: input.keywords ? JSON.parse(input.keywords) : [],
                extracted_tables: input.extracted_tables ? JSON.parse(input.extracted_tables) : []
            }
        }));
        
        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error getting recent inputs:', error);
        return new Response('Internal Server Error: ' + error.message, { status: 500 });
    }
}

/**
 * Delete input
 */
async function handleDeleteInput(inputId, env) {
    try {
        // Get the input record to find the R2 object key
        const input = await env.D1_DB.prepare(
            'SELECT r2_object_key FROM inputs WHERE id = ?'
        ).bind(inputId).first();
        
        if (!input) {
            return new Response('Input not found', { status: 404 });
        }
        
        // Delete from R2
        try {
            await env.R2_BUCKET.delete(input.r2_object_key);
        } catch (r2Error) {
            console.warn('Failed to delete from R2:', r2Error);
            // Continue with database deletion even if R2 deletion fails
        }
        
        // Delete related llm_outputs first (manual cascade since D1 doesn't support CASCADE DELETE)
        await env.D1_DB.prepare(
            'DELETE FROM llm_outputs WHERE input_id = ?'
        ).bind(inputId).run();
        
        // Then delete the input record
        await env.D1_DB.prepare(
            'DELETE FROM inputs WHERE id = ?'
        ).bind(inputId).run();
        
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error deleting input:', error);
        return new Response('Internal Server Error: ' + error.message, { status: 500 });
    }
}

/**
 * Generate insight manually
 */
async function handleGenerateInsight(request, env) {
    try {
        // Get recent summaries (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const summaries = await env.D1_DB.prepare(`
            SELECT lo.summary, lo.keywords, i.created_at
            FROM llm_outputs lo 
            JOIN inputs i ON lo.input_id = i.id 
            WHERE i.created_at >= ?
            ORDER BY i.created_at DESC
            LIMIT 50
        `).bind(thirtyDaysAgo.toISOString()).all();
        
        if (summaries.results.length === 0) {
            return new Response(JSON.stringify({ 
                error: '没有足够的数据来生成洞察，请先添加一些内容。' 
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Combine all summaries
        const combinedContent = summaries.results.map(s => 
            `${s.summary} (关键词: ${s.keywords})`
        ).join('\n\n');
        
        // Generate insight
        const prompt = `基于以下最近的输入内容，生成一个有价值的洞察。请找出内容之间的联系、模式或趋势，提供一个原创的观点。保持简洁但深刻。\n\n最近的内容摘要：\n${combinedContent}`;
        
        const insightText = await callAIAPI(prompt, env);
        
        // Store the insight with current date
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        
        await env.D1_DB.prepare(
            'INSERT INTO weekly_insights (insight_text, week_start_date) VALUES (?, ?)'
        ).bind(insightText, dateStr).run();
        
        return new Response(JSON.stringify({ 
            success: true, 
            insight: insightText 
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error generating manual insight:', error);
        return new Response('Internal Server Error: ' + error.message, { status: 500 });
    }
}