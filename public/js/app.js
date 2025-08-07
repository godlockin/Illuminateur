// 灵感收集器 - 主应用逻辑

class InspirationCollector {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentFilter = '';
        this.currentCategory = '';
        this.isLoading = false;
        this.contents = [];
        
        this.init();
    }

    async init() {
        // 检查认证状态
        if (!window.apiClient.isAuthenticated) {
            this.showLoginModal();
            return;
        }
        
        this.bindEvents();
        this.loadStats();
        this.loadContents();
        this.setupAutoSave();
    }

    bindEvents() {
        // 表单提交
        document.getElementById('contentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitContent();
        });

        // 输入类型切换
        document.querySelectorAll('.input-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchInputType(e.target.dataset.type);
            });
        });

        // 字符计数
        document.getElementById('contentInput').addEventListener('input', (e) => {
            this.updateCharCount(e.target.value.length);
        });

        // 搜索和筛选
        document.getElementById('searchInput').addEventListener('input', 
            this.debounce((e) => this.handleSearch(e.target.value), 300)
        );
        
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.handleCategoryFilter(e.target.value);
        });

        // 视图切换
        document.getElementById('viewToggle').addEventListener('click', () => {
            this.toggleView();
        });

        // 刷新按钮
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshContents();
        });

        // 加载更多
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMoreContents();
        });

        // 统计按钮
        document.getElementById('statsBtn').addEventListener('click', () => {
            this.showStats();
        });

        // 设置按钮
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });
        
        // 登出按钮（如果存在）
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    // 提交内容
    async submitContent() {
        const form = document.getElementById('contentForm');
        const input = document.getElementById('contentInput');
        const submitBtn = document.getElementById('submitBtn');
        
        const content = input.value.trim();
        if (!content) {
            this.showToast('请输入内容', 'warning');
            return;
        }

        const contentType = document.querySelector('.input-type-btn.active').dataset.type;
        const autoTag = document.getElementById('autoTag').checked;
        const deepAnalysis = document.getElementById('deepAnalysis').checked;

        // 验证URL格式
        if (contentType === 'url') {
            const urlPattern = /^https?:\/\/.+/i;
            if (!urlPattern.test(content)) {
                this.showToast('请输入有效的URL地址（以http://或https://开头）', 'error');
                return;
            }
        }

        // 显示加载状态
        this.setLoading(true);
        submitBtn.disabled = true;
        
        const loadingTexts = {
            text: '分析中...',
            url: '抓取中...',
            email: '处理中...'
        };
        
        submitBtn.innerHTML = `<span>🔄</span><span>${loadingTexts[contentType] || '分析中...'}</span>`;

        try {
            const response = await fetch('/api/content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content,
                    type: contentType,
                    autoTag,
                    deepAnalysis
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                const data = result.data;
                let message = '灵感收集成功！';
                
                if (contentType === 'url' && data.extractedTitle) {
                    message += ` 已抓取：${data.extractedTitle}`;
                }
                
                this.showToast(message, 'success');
                
                // 显示分析结果
                if (data.tags && data.tags.length > 0) {
                    this.showAnalysisResult(data);
                }
                
                input.value = '';
                this.updateCharCount(0);
                
                // 刷新内容列表和统计
                await Promise.all([
                    this.refreshContents(),
                    this.loadStats()
                ]);
            } else {
                throw new Error(result.error || '提交失败');
            }
        } catch (error) {
            console.error('提交内容失败:', error);
            
            // 更详细的错误处理
            let errorMessage = '提交失败';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = '网络连接失败，请检查网络连接';
            } else if (error.message.includes('HTTP error')) {
                errorMessage = '服务器错误，请稍后重试';
            } else {
                errorMessage = error.message;
            }
            
            this.showToast(errorMessage, 'error');
        } finally {
            this.setLoading(false);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>🚀</span><span>收集灵感</span>';
        }
    }

    // 切换输入类型
    switchInputType(type) {
        document.querySelectorAll('.input-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-type="${type}"]`).classList.add('active');
        
        const input = document.getElementById('contentInput');
        const placeholders = {
            text: '在这里输入你的想法、笔记或任何文本内容...',
            url: '粘贴网页链接，我会帮你分析内容...',
            email: '转发邮件内容到这里...',
        };
        
        input.placeholder = placeholders[type] || placeholders.text;
    }

    // 更新字符计数
    updateCharCount(count) {
        const charCountEl = document.getElementById('charCount');
        charCountEl.textContent = `${count}/5000`;
        
        if (count > 4500) {
            charCountEl.classList.add('text-red-500');
        } else if (count > 4000) {
            charCountEl.classList.add('text-yellow-500');
        } else {
            charCountEl.classList.remove('text-red-500', 'text-yellow-500');
        }
    }

    // 加载统计数据
    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            
            if (stats.success) {
                document.getElementById('totalCount').textContent = stats.data.totalContents || 0;
                document.getElementById('todayCount').textContent = stats.data.todayContents || 0;
                document.getElementById('tagCount').textContent = stats.data.totalTags || 0;
                document.getElementById('avgSentiment').textContent = 
                    (stats.data.avgSentiment || 0).toFixed(1);
            }
        } catch (error) {
            console.error('加载统计数据失败:', error);
        }
    }

    // 加载内容列表
    async loadContents(reset = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        if (reset) {
            this.currentPage = 1;
            this.contents = [];
        }

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                search: this.currentFilter,
                category: this.currentCategory
            });

            const response = await fetch(`/api/contents?${params}`);
            const result = await response.json();
            
            if (result.success) {
                if (reset) {
                    this.contents = result.data.contents;
                } else {
                    this.contents.push(...result.data.contents);
                }
                
                this.renderContents();
                
                // 显示/隐藏加载更多按钮
                const loadMoreBtn = document.getElementById('loadMoreBtn');
                if (result.data.hasMore) {
                    loadMoreBtn.classList.remove('hidden');
                } else {
                    loadMoreBtn.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('加载内容失败:', error);
            this.showToast('加载内容失败', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    // 渲染内容列表
    renderContents() {
        const container = document.getElementById('contentList');
        
        if (this.contents.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <div class="text-4xl mb-4">🌟</div>
                    <p>还没有收集任何灵感</p>
                    <p class="text-sm">开始分享你的第一个想法吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.contents.map(content => this.renderContentCard(content)).join('');
        
        // 添加事件监听器
        this.bindContentEvents();
    }

    // 渲染单个内容卡片
    renderContentCard(content) {
        const tags = JSON.parse(content.tags || '[]');
        const keywords = JSON.parse(content.keywords || '[]');
        const sentimentClass = this.getSentimentClass(content.sentiment);
        const importanceStars = this.getImportanceStars(content.importance_score);
        
        return `
            <div class="content-card fade-in-up" data-id="${content.id}">
                <div class="flex items-start space-x-4">
                    <div class="content-type-icon content-type-${content.content_type}">
                        ${this.getContentTypeIcon(content.content_type)}
                    </div>
                    
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center space-x-2">
                                <span class="sentiment-indicator ${sentimentClass}"></span>
                                <span class="text-sm text-gray-500">
                                    ${this.formatDate(content.created_at)}
                                </span>
                                ${importanceStars}
                            </div>
                            
                            <div class="flex items-center space-x-2">
                                <button class="text-gray-400 hover:text-blue-500 edit-btn" data-id="${content.id}">
                                    ✏️
                                </button>
                                <button class="text-gray-400 hover:text-red-500 delete-btn" data-id="${content.id}">
                                    🗑️
                                </button>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <h3 class="font-medium text-gray-900 mb-1">
                                ${content.summary || '无标题'}
                            </h3>
                            <p class="text-gray-600 text-sm line-clamp-3">
                                ${this.truncateText(content.original_content, 200)}
                            </p>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <div class="flex flex-wrap gap-1">
                                ${tags.map(tag => `
                                    <span class="tag tag-blue">${tag}</span>
                                `).join('')}
                            </div>
                            
                            <div class="text-xs text-gray-400">
                                ${content.word_count || 0} 字 · ${content.reading_time || 1} 分钟阅读
                            </div>
                        </div>
                        
                        ${keywords.length > 0 ? `
                            <div class="mt-2 pt-2 border-t border-gray-100">
                                <div class="text-xs text-gray-500 mb-1">关键词:</div>
                                <div class="flex flex-wrap gap-1">
                                    ${keywords.slice(0, 5).map(keyword => `
                                        <span class="tag tag-gray">${keyword}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // 绑定内容相关事件
    bindContentEvents() {
        // 编辑按钮
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.editContent(id);
            });
        });

        // 删除按钮
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.deleteContent(id);
            });
        });

        // 内容卡片点击
        document.querySelectorAll('.content-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const id = card.dataset.id;
                    this.viewContent(id);
                }
            });
        });
    }

    // 工具函数
    getSentimentClass(sentiment) {
        if (sentiment > 0.1) return 'sentiment-positive';
        if (sentiment < -0.1) return 'sentiment-negative';
        return 'sentiment-neutral';
    }

    getImportanceStars(score) {
        const stars = Math.round((score || 0) * 5);
        return `
            <div class="importance-stars">
                ${Array.from({length: 5}, (_, i) => 
                    `<span class="star ${i < stars ? 'filled' : ''}">${i < stars ? '★' : '☆'}</span>`
                ).join('')}
            </div>
        `;
    }

    getContentTypeIcon(type) {
        const icons = {
            text: '📝',
            url: '🔗',
            email: '📧',
            file: '📎'
        };
        return icons[type] || '📝';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
        
        return date.toLocaleDateString('zh-CN');
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 搜索处理
    handleSearch(query) {
        this.currentFilter = query;
        this.loadContents(true);
    }

    // 分类筛选
    handleCategoryFilter(category) {
        this.currentCategory = category;
        this.loadContents(true);
    }

    // 刷新内容
    refreshContents() {
        this.loadContents(true);
        this.loadStats();
        this.showToast('内容已刷新', 'info');
    }

    // 加载更多
    loadMoreContents() {
        this.currentPage++;
        this.loadContents();
    }

    // 设置加载状态
    setLoading(loading) {
        const overlay = document.getElementById('loadingOverlay');
        if (loading) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    // 显示Toast通知
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type} slide-in-right`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>${icons[type]}</span>
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(toast);
        
        // 自动移除
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // 自动保存设置
    setupAutoSave() {
        // 保存用户偏好设置
        const settings = {
            autoTag: document.getElementById('autoTag').checked,
            deepAnalysis: document.getElementById('deepAnalysis').checked
        };
        
        localStorage.setItem('inspirationCollectorSettings', JSON.stringify(settings));
    }

    // 显示分析结果
    showAnalysisResult(data) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'bg-green-50 border border-green-200 rounded-lg p-4 mb-4 fade-in-up';
        resultDiv.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="text-green-600 text-xl">✨</div>
                <div class="flex-1">
                    <h4 class="font-medium text-green-800 mb-2">AI分析完成</h4>
                    <div class="text-sm text-green-700 space-y-1">
                        <div><strong>摘要：</strong>${data.summary || '无摘要'}</div>
                        <div><strong>标签：</strong>${(data.tags || []).join(', ')}</div>
                        <div><strong>分类：</strong>${data.category || '未分类'}</div>
                        ${data.sentiment !== undefined ? `<div><strong>情感：</strong>${this.getSentimentText(data.sentiment)}</div>` : ''}
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-green-400 hover:text-green-600">
                    ✕
                </button>
            </div>
        `;
        
        // 插入到表单下方
        const form = document.getElementById('contentForm');
        form.parentNode.insertBefore(resultDiv, form.nextSibling);
        
        // 5秒后自动消失
        setTimeout(() => {
            if (resultDiv.parentNode) {
                resultDiv.style.opacity = '0';
                resultDiv.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (resultDiv.parentNode) {
                        resultDiv.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    // 获取情感文本
    getSentimentText(sentiment) {
        if (sentiment > 0.3) return '😊 积极';
        if (sentiment < -0.3) return '😔 消极';
        return '😐 中性';
    }

    // 占位方法，后续实现
    toggleView() {
        this.showToast('视图切换功能开发中', 'info');
    }

    showStats() {
        this.showToast('统计功能开发中', 'info');
    }

    showSettings() {
        this.showToast('设置功能开发中', 'info');
    }
    
    // 显示登录模态框
    showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <div class="text-center mb-6">
                    <div class="text-4xl mb-4">🔐</div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">登录验证</h2>
                    <p class="text-gray-600">请输入登录密钥以访问系统</p>
                </div>
                
                <form id="loginForm" class="space-y-4">
                    <div>
                        <label for="loginKey" class="block text-sm font-medium text-gray-700 mb-2">
                            登录密钥
                        </label>
                        <input 
                            type="password" 
                            id="loginKey" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="请输入登录密钥"
                            required
                        >
                    </div>
                    
                    <div class="text-sm text-gray-500">
                        💡 提示：登录密钥在环境变量 LOGIN_KEY 中配置
                    </div>
                    
                    <button 
                        type="submit" 
                        class="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                        登录
                    </button>
                </form>
                
                <div id="loginError" class="mt-4 text-red-600 text-sm hidden"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定登录表单事件
        const loginForm = modal.querySelector('#loginForm');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin(modal);
        });
        
        // 聚焦到输入框
        modal.querySelector('#loginKey').focus();
    }
    
    // 处理登录
    async handleLogin(modal) {
        const loginKey = modal.querySelector('#loginKey').value.trim();
        const errorDiv = modal.querySelector('#loginError');
        const submitBtn = modal.querySelector('button[type="submit"]');
        
        if (!loginKey) {
            this.showLoginError(errorDiv, '请输入登录密钥');
            return;
        }
        
        // 显示加载状态
        submitBtn.disabled = true;
        submitBtn.textContent = '验证中...';
        errorDiv.classList.add('hidden');
        
        try {
            const result = await window.apiClient.validateLogin(loginKey);
            
            if (result.success) {
                // 登录成功，移除模态框并初始化应用
                document.body.removeChild(modal);
                this.showToast('登录成功！', 'success');
                
                // 重新初始化应用
                this.bindEvents();
                this.loadStats();
                this.loadContents();
                this.setupAutoSave();
                
                // 添加登出按钮到头部
                this.addLogoutButton();
            } else {
                this.showLoginError(errorDiv, result.error || '登录失败');
            }
        } catch (error) {
            this.showLoginError(errorDiv, '网络错误，请稍后重试');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '登录';
        }
    }
    
    // 显示登录错误
    showLoginError(errorDiv, message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
    
    // 添加登出按钮
    addLogoutButton() {
        const headerButtons = document.querySelector('header .flex.items-center.space-x-4');
        if (headerButtons && !document.getElementById('logoutBtn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.className = 'text-gray-600 hover:text-red-600 transition-colors';
            logoutBtn.innerHTML = '🚪 登出';
            logoutBtn.addEventListener('click', () => this.logout());
            headerButtons.appendChild(logoutBtn);
        }
    }
    
    // 登出
    logout() {
        if (confirm('确定要登出吗？')) {
            window.apiClient.logout();
        }
    }

    editContent(id) {
        this.showToast('编辑功能开发中', 'info');
    }

    deleteContent(id) {
        if (confirm('确定要删除这条内容吗？')) {
            this.showToast('删除功能开发中', 'info');
        }
    }

    viewContent(id) {
        this.showToast('详情查看功能开发中', 'info');
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InspirationCollector();
});