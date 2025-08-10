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
                <button class="tab" onclick="switchTab('insights')">每周洞察</button>
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
                </div>
                
                <!-- Insights Tab -->
                <div id="insights-tab" class="tab-pane">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h2>每周洞察</h2>
                        <button class="btn" onclick="loadInsights()">🔄 刷新</button>
                    </div>
                    <div id="insights-list" class="insights-list">
                        <p>点击刷新按钮加载您的每周洞察...</p>
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
 * Call Gemini API with streaming support
 */
async function callGeminiAPI(prompt, env) {
    try {
        const requestBody = {
            contents: [{
                role: "user",
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                thinkingConfig: {
                    thinkingBudget: -1
                }
            },
            tools: [{
                googleSearch: {}
            }]
        };
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }
        
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.trim() && line.startsWith('data: ')) {
                    try {
                        const jsonData = JSON.parse(line.slice(6));
                        if (jsonData.candidates && jsonData.candidates[0] && jsonData.candidates[0].content) {
                            const parts = jsonData.candidates[0].content.parts;
                            if (parts && parts[0] && parts[0].text) {
                                result += parts[0].text;
                            }
                        }
                    } catch (e) {
                        // Skip invalid JSON lines
                    }
                }
            }
        }
        
        return result || 'No response generated';
    } catch (error) {
        console.error('Gemini API call failed:', error);
        throw error;
    }
}

/**
 * Analyze content with LLM (Gemini)
 */
async function analyzeWithLLM(content, type, env) {
    let generatedText = '';

    if (type === 'image') {
        // --- IMAGE ANALYSIS PATH ---
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(content)));

        // [OPTIMIZED PROMPT FOR IMAGE]
        const prompt = `You are a specialized JSON API for image analysis. Your sole function is to analyze the provided image and return a structured JSON response.

Instructions:
1.  **summary**: Write a one to two-sentence descriptive summary of the image.
2.  **keywords**: Identify 1-5 key objects, themes, or concepts in the image.

Output Format:
Your response MUST be a single, valid JSON object and nothing else. Do not include markdown formatting (e.g., \`\`\`json) or any other explanatory text.

Required JSON Schema:
{
  "summary": "string",
  "keywords": ["string"]
}`;

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg", // or other appropriate MIME type
                            data: base64Image
                        }
                    }
                ]
            }]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Gemini API error: ${response.status} ${errorBody}`);
        }

        const responseData = await response.json();
        generatedText = responseData.candidates[0].content.parts[0].text;


    } else {
        // --- TEXT/URL ANALYSIS PATH ---
        const textContent = typeof content === 'object' ? content.text : content;
        // Ensure tables is always an array
        const tables = typeof content === 'object' && Array.isArray(content.tables) ? content.tables : [];

        // [OPTIMIZED PROMPT FOR TEXT/URL]
        // Note: We are constructing a string that looks like a JSON object to send as the prompt.
        const prompt = `{
  "task": "StructuredContentAnalysis",
  "instructions": {
    "summary": "Analyze the 'textContent' and generate a concise summary of 2-3 sentences.",
    "keywords": "Extract 1 to 5 of the most relevant keywords from the 'textContent'. Return them as a JSON array of strings.",
    "tables": "Analyze each raw table string provided in the 'input_tables' array. Convert each table into a valid, well-formatted Markdown table string. If 'input_tables' is empty, return an empty array.",
    "output_format": "Your entire response MUST be a single, valid JSON object, without any markdown formatting or other text outside the JSON. The JSON object must match the schema: {\\"summary\\": \\"string\\", \\"keywords\\": [\\"string\\"], \\"extractedTables\\": [\\"string (Markdown format)\\"]}"
  },
  "data": {
    "textContent": ${JSON.stringify(textContent)},
    "input_tables": ${JSON.stringify(tables)}
  }
}`;
        // The callGeminiAPI function is assumed to exist and handle the request
        generatedText = await callGeminiAPI(prompt, env);
    }

    try {
        // Clean the response to remove potential markdown wrappers
        const cleanText = generatedText.replace(/^```json\s*|```\s*$/g, '');
        const analysis = JSON.parse(cleanText);
        return {
            summary: analysis.summary || 'No summary provided',
            keywords: analysis.keywords || [],
            extractedTables: analysis.extractedTables || [] // Return empty array for consistency
        };
    } catch (e) {
        console.error("Failed to parse JSON from LLM response:", generatedText);
        // Fallback if JSON parsing fails
        return {
            summary: `Failed to parse response. Raw output: ${generatedText.substring(0, 500)}`,
            keywords: ['error', 'parsing_failed'],
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
        
        const insightText = await callGeminiAPI(prompt, env);
        
        // Store weekly insight
        await env.D1_DB.prepare(
            'INSERT INTO weekly_insights (insight_text, week_start_date) VALUES (?, ?)'
        ).bind(insightText, weekStartStr).run();
        
        console.log('Generated weekly insight for', weekStartStr);
        
    } catch (error) {
        console.error('Error generating weekly insight:', error);
    }
}