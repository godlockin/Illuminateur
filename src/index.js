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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Illuminateur</h1>
            <p>Personal Insight Collector & Analyzer</p>
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="switchTab('capture')">Capture</button>
            <button class="tab" onclick="switchTab('insights')">Weekly Insights</button>
        </div>
        
        <div class="tab-content">
            <!-- Capture Tab -->
            <div id="capture-tab" class="tab-pane active">
                <div class="auth-section">
                    <div class="form-group">
                        <label for="access-token">Access Token:</label>
                        <input type="password" id="access-token" placeholder="Enter your access token">
                    </div>
                </div>
                
                <form id="capture-form">
                    <div class="form-group">
                        <label for="input-type">Input Type:</label>
                        <select id="input-type" onchange="toggleInputMethod()">
                            <option value="text">Text</option>
                            <option value="url">URL</option>
                            <option value="image">Image</option>
                        </select>
                    </div>
                    
                    <div id="text-input" class="form-group">
                        <label for="text-content">Text Content:</label>
                        <textarea id="text-content" placeholder="Enter your text here..."></textarea>
                    </div>
                    
                    <div id="url-input" class="form-group" style="display: none;">
                        <label for="url-content">URL:</label>
                        <input type="url" id="url-content" placeholder="https://example.com">
                    </div>
                    
                    <div id="image-input" class="form-group" style="display: none;">
                        <label>Image File:</label>
                        <div class="file-input" onclick="document.getElementById('image-file').click()">
                            <input type="file" id="image-file" accept="image/*" style="display: none;" onchange="updateFileName()">
                            <div id="file-text">📁 Click to select an image file</div>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn" id="submit-btn">
                        <span id="submit-text">Analyze & Store</span>
                        <span id="submit-loading" class="loading" style="display: none;"></span>
                    </button>
                </form>
                
                <div id="status" class="status"></div>
            </div>
            
            <!-- Insights Tab -->
            <div id="insights-tab" class="tab-pane">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2>Weekly Insights</h2>
                    <button class="btn" onclick="loadInsights()">🔄 Refresh</button>
                </div>
                <div id="insights-list" class="insights-list">
                    <p>Click refresh to load your weekly insights...</p>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let accessToken = '';
        
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
                fileText.textContent = '📁 Click to select an image file';
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
        }
        
        async function loadInsights() {
            const token = document.getElementById('access-token').value;
            if (!token) {
                showStatus('Please enter your access token first', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/insights', {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to load insights');
                }
                
                const insights = await response.json();
                const insightsList = document.getElementById('insights-list');
                
                if (insights.length === 0) {
                    insightsList.innerHTML = '<p>No weekly insights generated yet. Check back after Sunday!</p>';
                } else {
                    insightsList.innerHTML = insights.map(insight => 
                        '<div class="insight-item">' +
                            '<div class="insight-date">Week of ' + insight.week_start_date + '</div>' +
                            '<div class="insight-text">' + insight.insight_text + '</div>' +
                        '</div>'
                    ).join('');
                }
            } catch (error) {
                showStatus('Error loading insights: ' + error.message, 'error');
            }
        }
        
        document.getElementById('capture-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const token = document.getElementById('access-token').value;
            if (!token) {
                showStatus('Please enter your access token first', 'error');
                return;
            }
            
            const inputType = document.getElementById('input-type').value;
            let formData = new FormData();
            
            formData.append('type', inputType);
            
            if (inputType === 'text') {
                const textContent = document.getElementById('text-content').value;
                if (!textContent.trim()) {
                    showStatus('Please enter some text', 'error');
                    return;
                }
                formData.append('content', textContent);
            } else if (inputType === 'url') {
                const urlContent = document.getElementById('url-content').value;
                if (!urlContent.trim()) {
                    showStatus('Please enter a URL', 'error');
                    return;
                }
                formData.append('content', urlContent);
            } else if (inputType === 'image') {
                const imageFile = document.getElementById('image-file').files[0];
                if (!imageFile) {
                    showStatus('Please select an image file', 'error');
                    return;
                }
                formData.append('file', imageFile);
            }
            
            setLoading(true);
            
            try {
                const response = await fetch('/api/capture', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(error || 'Failed to process input');
                }
                
                const result = await response.json();
                showStatus('Successfully processed and analyzed your input!', 'success');
                
                // Clear form
                document.getElementById('capture-form').reset();
                toggleInputMethod();
                updateFileName();
                
            } catch (error) {
                showStatus('Error: ' + error.message, 'error');
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
 * Analyze content with LLM (Gemini)
 */
async function analyzeWithLLM(content, type, env) {
    let prompt;
    let requestBody;
    
    if (type === 'image') {
        // For image analysis
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(content)));
        
        prompt = `Analyze this image and provide:
1. A concise summary of what you see
2. 1-5 relevant keywords

Respond in JSON format: {"summary": "...", "keywords": ["...", "..."]}`;
        
        requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }]
        };
    } else {
        // For text/URL analysis
        const textContent = typeof content === 'object' ? content.text : content;
        const tables = typeof content === 'object' ? content.tables : [];
        
        prompt = `Analyze the following content and provide:
1. A concise summary (2-3 sentences)
2. 1-5 relevant keywords
3. If there are any tables, extract their key information

Content: ${textContent}

${tables.length > 0 ? `Tables found: ${tables.join('\n\n')}` : ''}

Respond in JSON format: {"summary": "...", "keywords": ["...", "..."], "extractedTables": [{"title": "...", "data": "..."}]}`;
        
        requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };
    }
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const result = await response.json();
    const generatedText = result.candidates[0].content.parts[0].text;
    
    try {
        // Try to parse JSON response
        const analysis = JSON.parse(generatedText);
        return {
            summary: analysis.summary || 'No summary provided',
            keywords: analysis.keywords || [],
            extractedTables: analysis.extractedTables || null
        };
    } catch (e) {
        // Fallback if JSON parsing fails
        return {
            summary: generatedText.substring(0, 500),
            keywords: ['analysis', 'content'],
            extractedTables: null
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
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`, {
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
        
        const result = await response.json();
        const insightText = result.candidates[0].content.parts[0].text;
        
        // Store weekly insight
        await env.D1_DB.prepare(
            'INSERT INTO weekly_insights (insight_text, week_start_date) VALUES (?, ?)'
        ).bind(insightText, weekStartStr).run();
        
        console.log('Generated weekly insight for', weekStartStr);
        
    } catch (error) {
        console.error('Error generating weekly insight:', error);
    }
}