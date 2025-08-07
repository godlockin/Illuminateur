// 灵感收集器 - API接口模块

class ApiClient {
    constructor() {
        this.baseUrl = '/api';
        this.timeout = 30000; // 30秒超时
        this.authToken = localStorage.getItem('auth_token') || null;
        this.isAuthenticated = !!this.authToken;
    }

    // 设置认证令牌
    setAuthToken(token) {
        this.authToken = token;
        this.isAuthenticated = !!token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    // 获取认证令牌
    getAuthToken() {
        return this.authToken;
    }

    // 登出
    logout() {
        this.setAuthToken(null);
        window.location.reload();
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // 添加认证头
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        const config = {
            timeout: this.timeout,
            headers,
            ...options
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                // 处理认证错误
                if (response.status === 401) {
                    this.logout();
                    throw new Error('认证失败，请重新登录');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('请求超时，请稍后重试');
            }
            throw error;
        }
    }

    // GET请求
    async get(endpoint, params = {}) {
        const url = new URL(endpoint, window.location.origin + this.baseUrl);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                url.searchParams.append(key, params[key]);
            }
        });
        
        return this.request(url.pathname + url.search, {
            method: 'GET'
        });
    }

    // POST请求
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT请求
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE请求
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // 提交内容
    async submitContent(contentData) {
        return this.post('/content', contentData);
    }

    // 获取内容列表
    async getContents(params = {}) {
        return this.get('/contents', params);
    }

    // 获取单个内容
    async getContent(id) {
        return this.get(`/content/${id}`);
    }

    // 更新内容
    async updateContent(id, data) {
        return this.put(`/content/${id}`, data);
    }

    // 删除内容
    async deleteContent(id) {
        return this.delete(`/content/${id}`);
    }

    // 获取统计数据
    async getStats() {
        return this.get('/stats');
    }

    // 获取标签列表
    async getTags() {
        return this.get('/tags');
    }

    // 创建标签
    async createTag(tagData) {
        return this.post('/tags', tagData);
    }

    // 搜索内容
    async searchContents(query, filters = {}) {
        return this.get('/search', {
            q: query,
            ...filters
        });
    }

    // 获取内容分析
    async analyzeContent(content, options = {}) {
        return this.post('/analyze', {
            content,
            ...options
        });
    }

    // 批量操作
    async batchOperation(operation, ids) {
        return this.post('/batch', {
            operation,
            ids
        });
    }

    // 导出数据
    async exportData(format = 'json', filters = {}) {
        return this.get('/export', {
            format,
            ...filters
        });
    }

    // 获取用户设置
    async getSettings() {
        return this.get('/settings');
    }

    // 更新用户设置
    async updateSettings(settings) {
        return this.put('/settings', settings);
    }

    // 健康检查
    async healthCheck() {
        return this.get('/health');
    }

    // 获取版本信息
    async getVersion() {
        return this.get('/version');
    }

    // 验证登录密钥
    async validateLogin(loginKey) {
        try {
            // 检查是否为本地开发环境
            const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalDev) {
                // 本地开发环境：模拟认证
                // 可以设置一个默认的测试密钥，或者接受任何非空密钥
                const validKeys = ['MyTestKey123!'];
                
                if (loginKey && (validKeys.includes(loginKey) || loginKey.length >= 6)) {
                    this.setAuthToken(loginKey);
                    return { success: true };
                } else {
                    return { success: false, error: '本地测试环境：请输入有效的测试密钥（如：MyTestKey123）' };
                }
            } else {
                // 生产环境：调用后端API验证
                const response = await fetch(`${this.baseUrl}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ loginKey })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    this.setAuthToken(data.token || loginKey);
                    return { success: true };
                } else {
                    return { success: false, error: data.error || '登录密钥无效' };
                }
            }
        } catch (error) {
            return { success: false, error: '验证失败: ' + error.message };
        }
    }
}

// 创建全局API客户端实例
window.apiClient = new ApiClient();

// 导出API客户端类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}