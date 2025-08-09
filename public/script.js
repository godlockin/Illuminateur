/**
 * Illuminateur 前端脚本
 * 智能内容处理工具的用户界面逻辑
 */

class IlluminateurApp {
    constructor() {
        this.accessToken = localStorage.getItem('illuminateur_token');
        this.currentInputType = 'text';
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuth();
        this.setupDragAndDrop();
    }

    // 事件绑定
    bindEvents() {
        // 输入类型切换
        document.querySelectorAll('.input-type').forEach(type => {
            type.addEventListener('click', (e) => {
                this.switchInputType(e.target.closest('.input-type').dataset.type);
            });
        });

        // 处理按钮
        document.getElementById('processBtn').addEventListener('click', () => {
            this.processContent();
        });

        // 清空按钮
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearInput();
        });

        // 侧边栏按钮
        document.getElementById('statsBtn').addEventListener('click', () => {
            this.toggleSidebar('stats');
        });

        document.getElementById('searchBtn').addEventListener('click', () => {
            this.toggleSidebar('search');
        });

        // 侧边栏关闭按钮
        document.querySelectorAll('.panel-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeSidebar();
            });
        });

        // 遮罩层点击关闭
        document.getElementById('overlay').addEventListener('click', () => {
            this.closeSidebar();
            this.closeModal();
        });

        // 文件选择
        document.getElementById('imageFile').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // URL输入变化
        document.getElementById('urlContent').addEventListener('input', (e) => {
            this.handleUrlInput(e.target.value);
        });

        // 搜索功能
        document.getElementById('searchSubmitBtn').addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('searchQuery').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // 统计刷新
        document.getElementById('refreshStatsBtn').addEventListener('click', () => {
            this.loadStatistics();
        });

        // 登录
        document.getElementById('loginSubmit').addEventListener('click', () => {
            this.handleLogin();
        });

        // 模态框关闭
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // 导出和分享
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportResults();
        });

        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareResults();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    // 身份验证检查
    checkAuth() {
        if (!this.accessToken) {
            this.showLoginModal();
        } else {
            this.validateToken();
        }
    }

    // 显示登录模态框
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.classList.add('show');
        document.getElementById('overlay').classList.add('show');
        document.getElementById('accessToken').focus();
    }

    // 处理登录
    async handleLogin() {
        const token = document.getElementById('accessToken').value.trim();
        const errorDiv = document.getElementById('loginError');
        
        if (!token) {
            this.showError(errorDiv, '请输入访问令牌');
            return;
        }

        try {
            const response = await fetch('/api/health', {
                headers: {
                    'X-Access-Token': token
                }
            });

            if (response.ok) {
                this.accessToken = token;
                localStorage.setItem('illuminateur_token', token);
                this.closeModal();
                this.showNotification('登录成功', 'success');
            } else {
                this.showError(errorDiv, '访问令牌无效');
            }
        } catch (error) {
            this.showError(errorDiv, '登录失败，请检查网络连接');
        }
    }

    // 验证令牌
    async validateToken() {
        try {
            const response = await fetch('/api/health', {
                headers: {
                    'X-Access-Token': this.accessToken
                }
            });

            if (!response.ok) {
                localStorage.removeItem('illuminateur_token');
                this.accessToken = null;
                this.showLoginModal();
            }
        } catch (error) {
            console.error('Token validation failed:', error);
        }
    }

    // 切换输入类型
    switchInputType(type) {
        // 更新活动状态
        document.querySelectorAll('.input-type').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

        // 显示对应输入区域
        document.querySelectorAll('.input-area').forEach(area => area.classList.add('hidden'));
        document.getElementById(`${type}Input`).classList.remove('hidden');

        this.currentInputType = type;
        this.clearInput();
    }

    // 清空输入
    clearInput() {
        document.getElementById('textContent').value = '';
        document.getElementById('urlContent').value = '';
        document.getElementById('imageFile').value = '';
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('urlPreview').classList.remove('show');
        this.hideResults();
    }

    // 设置拖拽上传
    setupDragAndDrop() {
        const uploadArea = document.getElementById('fileUploadArea');
        
        uploadArea.addEventListener('click', () => {
            document.getElementById('imageFile').click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });
    }

    // 处理文件选择
    handleFileSelect(file) {
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            this.showNotification('请选择图片文件', 'error');
            return;
        }

        // 验证文件大小 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('文件大小不能超过10MB', 'error');
            return;
        }

        // 显示预览
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `
                <img src="${e.target.result}" alt="预览图片">
                <p class="upload-hint">文件: ${file.name} (${this.formatFileSize(file.size)})</p>
            `;
        };
        reader.readAsDataURL(file);
    }

    // 处理URL输入
    handleUrlInput(url) {
        const preview = document.getElementById('urlPreview');
        
        if (this.isValidUrl(url)) {
            preview.innerHTML = `
                <div class="url-info">
                    <span class="icon">🔗</span>
                    <span>准备解析: ${url}</span>
                </div>
            `;
            preview.classList.add('show');
        } else {
            preview.classList.remove('show');
        }
    }

    // 处理内容
    async processContent() {
        if (this.isProcessing) return;

        const content = this.getInputContent();
        if (!content) {
            this.showNotification('请输入要处理的内容', 'warning');
            return;
        }

        this.setProcessingState(true);

        try {
            const formData = new FormData();
            formData.append('type', this.currentInputType);

            if (this.currentInputType === 'text') {
                formData.append('content', content);
            } else if (this.currentInputType === 'url') {
                formData.append('url', content);
            } else if (this.currentInputType === 'image') {
                formData.append('image', content);
            }

            const response = await fetch('/api/process', {
                method: 'POST',
                headers: {
                    'X-Access-Token': this.accessToken
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`处理失败: ${response.status}`);
            }

            const result = await response.json();
            this.displayResults(result);
            this.showNotification('内容处理完成', 'success');

        } catch (error) {
            console.error('Processing error:', error);
            this.showNotification('处理失败: ' + error.message, 'error');
        } finally {
            this.setProcessingState(false);
        }
    }

    // 获取输入内容
    getInputContent() {
        switch (this.currentInputType) {
            case 'text':
                return document.getElementById('textContent').value.trim();
            case 'url':
                return document.getElementById('urlContent').value.trim();
            case 'image':
                return document.getElementById('imageFile').files[0];
            default:
                return null;
        }
    }

    // 设置处理状态
    setProcessingState(processing) {
        this.isProcessing = processing;
        const btn = document.getElementById('processBtn');
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.loading-spinner');

        if (processing) {
            btn.disabled = true;
            btnText.textContent = '处理中...';
            spinner.classList.remove('hidden');
        } else {
            btn.disabled = false;
            btnText.textContent = '开始处理';
            spinner.classList.add('hidden');
        }
    }

    // 显示结果
    displayResults(result) {
        const resultsSection = document.getElementById('resultsSection');
        const resultsContent = document.getElementById('resultsContent');

        let html = '';

        // 原始内容
        if (result.extractedText) {
            html += `
                <div class="result-card">
                    <h3><span class="icon">📄</span>提取的文本</h3>
                    <div class="result-content">${this.escapeHtml(result.extractedText)}</div>
                </div>
            `;
        }

        // 中文翻译
        if (result.chineseText) {
            html += `
                <div class="result-card">
                    <h3><span class="icon">🇨🇳</span>中文版本</h3>
                    <div class="result-content chinese">${this.escapeHtml(result.chineseText)}</div>
                </div>
            `;
        }

        // 英文翻译
        if (result.englishText) {
            html += `
                <div class="result-card">
                    <h3><span class="icon">🇺🇸</span>英文版本</h3>
                    <div class="result-content english">${this.escapeHtml(result.englishText)}</div>
                </div>
            `;
        }

        // 摘要
        if (result.summary) {
            html += `
                <div class="result-card">
                    <h3><span class="icon">📋</span>内容摘要</h3>
                    <div class="result-content summary">${this.escapeHtml(result.summary)}</div>
                </div>
            `;
        }

        // 标签
        if (result.tags && result.tags.length > 0) {
            const tagsHtml = result.tags.map(tag => 
                `<span class="tag category-${tag.category || '其他'}">
                    ${this.escapeHtml(tag.name)}
                    ${tag.confidence ? `<span class="tag-confidence">${Math.round(tag.confidence * 100)}%</span>` : ''}
                </span>`
            ).join('');

            html += `
                <div class="result-card">
                    <h3><span class="icon">🏷️</span>智能标签</h3>
                    <div class="tags-container">${tagsHtml}</div>
                </div>
            `;
        }

        resultsContent.innerHTML = html;
        resultsSection.classList.add('show');
        
        // 滚动到结果区域
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // 隐藏结果
    hideResults() {
        document.getElementById('resultsSection').classList.remove('show');
    }

    // 切换侧边栏
    toggleSidebar(panel) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const currentPanel = document.querySelector('.sidebar-panel.active');
        const targetPanel = document.getElementById(`${panel}Panel`);

        if (currentPanel) {
            currentPanel.classList.remove('active');
        }

        if (sidebar.classList.contains('show') && currentPanel === targetPanel) {
            // 关闭侧边栏
            this.closeSidebar();
        } else {
            // 打开侧边栏
            targetPanel.classList.add('active');
            sidebar.classList.add('show');
            overlay.classList.add('show');

            // 加载对应数据
            if (panel === 'stats') {
                this.loadStatistics();
            }
        }
    }

    // 关闭侧边栏
    closeSidebar() {
        document.getElementById('sidebar').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
        document.querySelectorAll('.sidebar-panel').forEach(panel => {
            panel.classList.remove('active');
        });
    }

    // 执行搜索
    async performSearch() {
        const query = document.getElementById('searchQuery').value.trim();
        const contentType = document.getElementById('contentTypeFilter').value;
        const dateFrom = document.getElementById('dateFromFilter').value;
        const dateTo = document.getElementById('dateToFilter').value;

        if (!query) {
            this.showNotification('请输入搜索关键词', 'warning');
            return;
        }

        try {
            const params = new URLSearchParams({
                q: query,
                ...(contentType && { type: contentType }),
                ...(dateFrom && { from: dateFrom }),
                ...(dateTo && { to: dateTo })
            });

            const response = await fetch(`/api/search?${params}`, {
                headers: {
                    'X-Access-Token': this.accessToken
                }
            });

            if (!response.ok) {
                throw new Error('搜索失败');
            }

            const results = await response.json();
            this.displaySearchResults(results);

        } catch (error) {
            console.error('Search error:', error);
            this.showNotification('搜索失败: ' + error.message, 'error');
        }
    }

    // 显示搜索结果
    displaySearchResults(results) {
        const container = document.getElementById('searchResults');
        
        if (!results.contents || results.contents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-title">未找到相关内容</div>
                    <div class="empty-state-description">尝试使用不同的关键词或调整筛选条件</div>
                </div>
            `;
            return;
        }

        const html = results.contents.map(item => `
            <div class="search-result-item" onclick="app.viewContent('${item.id}')">
                <div class="search-result-title">
                    <span class="icon">${this.getContentTypeIcon(item.content_type)}</span>
                    ${this.escapeHtml(item.title || '无标题')}
                </div>
                <div class="search-result-preview">
                    ${this.escapeHtml(this.truncateText(item.summary || item.extracted_text, 100))}
                </div>
                <div class="search-result-meta">
                    <span>${item.content_type}</span>
                    <span>${this.formatDate(item.created_at)}</span>
                </div>
                ${item.tags ? `
                    <div class="tags-container">
                        ${item.tags.slice(0, 3).map(tag => 
                            `<span class="tag category-${tag.category}">${this.escapeHtml(tag.name)}</span>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');

        container.innerHTML = html;
    }

    // 查看内容详情
    async viewContent(contentId) {
        try {
            const response = await fetch(`/api/content/${contentId}`, {
                headers: {
                    'X-Access-Token': this.accessToken
                }
            });

            if (!response.ok) {
                throw new Error('获取内容失败');
            }

            const content = await response.json();
            this.showContentModal(content);

        } catch (error) {
            console.error('View content error:', error);
            this.showNotification('获取内容失败: ' + error.message, 'error');
        }
    }

    // 显示内容模态框
    showContentModal(content) {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        const body = document.getElementById('modalBody');

        title.textContent = content.title || '内容详情';
        
        let html = `
            <div class="content-detail">
                <div class="content-meta">
                    <span class="content-type">${this.getContentTypeIcon(content.content_type)} ${content.content_type}</span>
                    <span class="content-date">${this.formatDate(content.created_at)}</span>
                </div>
        `;

        if (content.extracted_text) {
            html += `
                <div class="content-section">
                    <h4>原始文本</h4>
                    <div class="content-text">${this.escapeHtml(content.extracted_text)}</div>
                </div>
            `;
        }

        if (content.chinese_text) {
            html += `
                <div class="content-section">
                    <h4>中文版本</h4>
                    <div class="content-text chinese">${this.escapeHtml(content.chinese_text)}</div>
                </div>
            `;
        }

        if (content.english_text) {
            html += `
                <div class="content-section">
                    <h4>英文版本</h4>
                    <div class="content-text english">${this.escapeHtml(content.english_text)}</div>
                </div>
            `;
        }

        if (content.summary) {
            html += `
                <div class="content-section">
                    <h4>摘要</h4>
                    <div class="content-text summary">${this.escapeHtml(content.summary)}</div>
                </div>
            `;
        }

        if (content.tags && content.tags.length > 0) {
            const tagsHtml = content.tags.map(tag => 
                `<span class="tag category-${tag.category}">${this.escapeHtml(tag.name)}</span>`
            ).join('');
            
            html += `
                <div class="content-section">
                    <h4>标签</h4>
                    <div class="tags-container">${tagsHtml}</div>
                </div>
            `;
        }

        html += '</div>';
        body.innerHTML = html;
        
        modal.classList.add('show');
        document.getElementById('overlay').classList.add('show');
    }

    // 加载统计数据
    async loadStatistics() {
        const period = document.getElementById('statsPeriod').value;
        const days = document.getElementById('statsDays').value;

        try {
            const response = await fetch(`/api/statistics?period=${period}&days=${days}`, {
                headers: {
                    'X-Access-Token': this.accessToken
                }
            });

            if (!response.ok) {
                throw new Error('获取统计数据失败');
            }

            const stats = await response.json();
            this.displayStatistics(stats);

        } catch (error) {
            console.error('Load statistics error:', error);
            this.showNotification('获取统计数据失败: ' + error.message, 'error');
        }
    }

    // 显示统计数据
    displayStatistics(stats) {
        const container = document.getElementById('statsContent');
        
        let html = '';

        // 概览统计
        if (stats.overview) {
            html += `
                <div class="stat-card">
                    <h4>数据概览</h4>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-number">${stats.overview.total_contents || 0}</div>
                            <div class="stat-label">总内容数</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${stats.overview.total_tags || 0}</div>
                            <div class="stat-label">总标签数</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // 内容统计
        if (stats.contentStats) {
            html += `
                <div class="stat-card">
                    <h4>内容统计</h4>
                    <div class="stat-number">${stats.contentStats.totalProcessed || 0}</div>
                    <div class="stat-label">最近处理数量</div>
                </div>
            `;
        }

        // 趋势数据
        if (stats.trends) {
            html += `
                <div class="stat-card">
                    <h4>趋势分析</h4>
                    <div class="stat-trend ${this.getTrendClass(stats.trends.content.change)}">
                        <span>内容增长: ${stats.trends.content.change > 0 ? '+' : ''}${stats.trends.content.change}%</span>
                    </div>
                </div>
            `;
        }

        // 标签统计
        if (stats.tagStats && stats.tagStats.length > 0) {
            const topTags = stats.tagStats.slice(0, 10);
            const tagsHtml = topTags.map(tag => `
                <div class="tag-stat-item">
                    <span class="tag category-${tag.category}">${this.escapeHtml(tag.name)}</span>
                    <span class="tag-count">${tag.usage_count}</span>
                </div>
            `).join('');

            html += `
                <div class="stat-card">
                    <h4>热门标签</h4>
                    <div class="tag-stats">${tagsHtml}</div>
                </div>
            `;
        }

        container.innerHTML = html || `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-title">暂无统计数据</div>
                <div class="empty-state-description">开始处理一些内容来查看统计信息</div>
            </div>
        `;
    }

    // 导出结果
    exportResults() {
        const resultsContent = document.getElementById('resultsContent');
        if (!resultsContent.innerHTML.trim()) {
            this.showNotification('没有可导出的结果', 'warning');
            return;
        }

        // 提取文本内容
        const textContent = resultsContent.innerText;
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `illuminateur-results-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('结果已导出', 'success');
    }

    // 分享结果
    shareResults() {
        const resultsContent = document.getElementById('resultsContent');
        if (!resultsContent.innerHTML.trim()) {
            this.showNotification('没有可分享的结果', 'warning');
            return;
        }

        const textContent = resultsContent.innerText;
        
        if (navigator.share) {
            navigator.share({
                title: 'Illuminateur 处理结果',
                text: textContent
            }).catch(console.error);
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(textContent).then(() => {
                this.showNotification('结果已复制到剪贴板', 'success');
            }).catch(() => {
                this.showNotification('复制失败', 'error');
            });
        } else {
            this.showNotification('浏览器不支持分享功能', 'warning');
        }
    }

    // 关闭模态框
    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
        document.getElementById('overlay').classList.remove('show');
    }

    // 显示通知
    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <div class="notification-content">
                <div class="notification-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // 关闭按钮事件
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.removeNotification(notification);
        });

        container.appendChild(notification);
        
        // 显示动画
        setTimeout(() => notification.classList.add('show'), 100);
        
        // 自动移除
        if (duration > 0) {
            setTimeout(() => this.removeNotification(notification), duration);
        }
    }

    // 移除通知
    removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // 显示错误
    showError(element, message) {
        element.textContent = message;
        element.classList.add('show');
        setTimeout(() => element.classList.remove('show'), 5000);
    }

    // 键盘快捷键
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter: 处理内容
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.processContent();
        }
        
        // Escape: 关闭模态框和侧边栏
        if (e.key === 'Escape') {
            this.closeModal();
            this.closeSidebar();
        }
        
        // Ctrl/Cmd + K: 打开搜索
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.toggleSidebar('search');
            setTimeout(() => {
                document.getElementById('searchQuery').focus();
            }, 300);
        }
    }

    // 工具函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    getContentTypeIcon(type) {
        const icons = {
            text: '📝',
            url: '🔗',
            image: '🖼️'
        };
        return icons[type] || '📄';
    }

    getTrendClass(change) {
        if (change > 0) return 'positive';
        if (change < 0) return 'negative';
        return 'neutral';
    }
}

// 初始化应用
const app = new IlluminateurApp();

// 全局错误处理
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    app.showNotification('发生了一个错误，请刷新页面重试', 'error');
});

// 网络状态监听
window.addEventListener('online', () => {
    app.showNotification('网络连接已恢复', 'success');
});

window.addEventListener('offline', () => {
    app.showNotification('网络连接已断开', 'warning');
});

// 导出全局实例
window.app = app;