// 灵感收集器 - UI工具模块

class UIUtils {
    constructor() {
        this.themes = ['light', 'dark', 'auto'];
        this.currentTheme = this.getStoredTheme() || 'auto';
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupThemeToggle();
        this.setupKeyboardShortcuts();
        this.setupScrollEffects();
    }

    // 主题管理
    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    setStoredTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    applyTheme() {
        const theme = this.currentTheme === 'auto' 
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : this.currentTheme;
        
        document.documentElement.setAttribute('data-theme', theme);
        
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    setupThemeToggle() {
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.currentTheme === 'auto') {
                this.applyTheme();
            }
        });
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.currentTheme = themes[nextIndex];
        this.setStoredTheme(this.currentTheme);
        this.applyTheme();
        
        this.showToast(`主题已切换到: ${this.getThemeDisplayName(this.currentTheme)}`, 'info');
    }

    getThemeDisplayName(theme) {
        const names = {
            light: '浅色',
            dark: '深色',
            auto: '自动'
        };
        return names[theme] || theme;
    }

    // 键盘快捷键
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter: 提交表单
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const form = document.getElementById('contentForm');
                if (form) {
                    e.preventDefault();
                    form.dispatchEvent(new Event('submit'));
                }
            }
            
            // Ctrl/Cmd + K: 聚焦搜索框
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
            
            // Ctrl/Cmd + R: 刷新内容
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                if (window.app && window.app.refreshContents) {
                    window.app.refreshContents();
                }
            }
            
            // Escape: 清除搜索
            if (e.key === 'Escape') {
                const searchInput = document.getElementById('searchInput');
                if (searchInput && searchInput.value) {
                    searchInput.value = '';
                    searchInput.dispatchEvent(new Event('input'));
                }
            }
        });
    }

    // 滚动效果
    setupScrollEffects() {
        let lastScrollY = window.scrollY;
        const header = document.querySelector('header');
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            // 头部隐藏/显示
            if (header) {
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    header.style.transform = 'translateY(-100%)';
                } else {
                    header.style.transform = 'translateY(0)';
                }
            }
            
            lastScrollY = currentScrollY;
        });
    }

    // 模态框管理
    createModal(title, content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
                <div class="flex items-center justify-between p-4 border-b">
                    <h3 class="text-lg font-semibold">${title}</h3>
                    <button class="modal-close text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>
                <div class="p-4">
                    ${content}
                </div>
                ${options.showFooter !== false ? `
                    <div class="flex justify-end space-x-2 p-4 border-t">
                        <button class="modal-cancel px-4 py-2 text-gray-600 hover:text-gray-800">
                            取消
                        </button>
                        <button class="modal-confirm px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            确定
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        // 绑定事件
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        if (options.showFooter !== false) {
            modal.querySelector('.modal-cancel').addEventListener('click', () => {
                this.closeModal(modal);
            });
            
            modal.querySelector('.modal-confirm').addEventListener('click', () => {
                if (options.onConfirm) {
                    options.onConfirm();
                }
                this.closeModal(modal);
            });
        }
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        document.body.appendChild(modal);
        
        // 添加动画
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            const content = modal.querySelector('.bg-white');
            content.style.transform = 'scale(1)';
        });
        
        return modal;
    }

    closeModal(modal) {
        modal.style.opacity = '0';
        const content = modal.querySelector('.bg-white');
        content.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 200);
    }

    // 确认对话框
    confirm(message, title = '确认') {
        return new Promise((resolve) => {
            const modal = this.createModal(title, `<p>${message}</p>`, {
                onConfirm: () => resolve(true)
            });
            
            modal.querySelector('.modal-cancel').addEventListener('click', () => {
                resolve(false);
            });
        });
    }

    // 提示对话框
    alert(message, title = '提示') {
        return new Promise((resolve) => {
            const modal = this.createModal(title, `<p>${message}</p>`, {
                showFooter: false
            });
            
            modal.querySelector('.modal-close').addEventListener('click', () => {
                resolve();
            });
        });
    }

    // 输入对话框
    prompt(message, defaultValue = '', title = '输入') {
        return new Promise((resolve) => {
            const inputId = 'prompt-input-' + Date.now();
            const content = `
                <p class="mb-4">${message}</p>
                <input 
                    type="text" 
                    id="${inputId}" 
                    value="${defaultValue}" 
                    class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入..."
                >
            `;
            
            const modal = this.createModal(title, content, {
                onConfirm: () => {
                    const input = document.getElementById(inputId);
                    resolve(input.value);
                }
            });
            
            modal.querySelector('.modal-cancel').addEventListener('click', () => {
                resolve(null);
            });
            
            // 聚焦输入框
            setTimeout(() => {
                const input = document.getElementById(inputId);
                input.focus();
                input.select();
            }, 100);
        });
    }

    // Toast通知
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer') || this.createToastContainer();
        const toast = document.createElement('div');
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const colors = {
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            info: 'bg-blue-50 border-blue-200 text-blue-800'
        };
        
        toast.className = `toast ${colors[type]} slide-in-right`;
        toast.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>${icons[type]}</span>
                <span>${message}</span>
                <button class="ml-2 text-gray-400 hover:text-gray-600 toast-close">
                    ✕
                </button>
            </div>
        `;
        
        // 关闭按钮
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        container.appendChild(toast);
        
        // 自动移除
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }
        
        return toast;
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
        return container;
    }

    removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    // 加载状态管理
    showLoading(message = '加载中...') {
        const existing = document.getElementById('loadingOverlay');
        if (existing) return existing;
        
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-white rounded-lg p-6 flex items-center space-x-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(overlay);
        return overlay;
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // 工具函数
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve();
        }
    }

    // 响应式工具
    isMobile() {
        return window.innerWidth <= 768;
    }

    isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }

    isDesktop() {
        return window.innerWidth > 1024;
    }
}

// 创建全局UI工具实例
window.uiUtils = new UIUtils();

// 导出UI工具类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIUtils;
}