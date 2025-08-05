// 模拟数据和API响应
class MockAPI {
    constructor() {
        this.contents = [
            {
                id: '1',
                content: '今天看到一个很有趣的AI产品设计思路：将复杂的技术概念通过简单的交互界面呈现给用户，让技术变得更加亲民。',
                type: 'text',
                source: 'manual',
                summary: '关于AI产品设计的思考，强调简化复杂技术的重要性',
                keywords: ['AI产品', '用户体验', '技术简化'],
                tags: ['产品设计', 'AI', '用户体验'],
                sentiment: 0.7,
                category: '产品思考',
                importance: 0.8,
                word_count: 45,
                reading_time: 1,
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '2',
                content: 'https://example.com/article-about-cloudflare-workers',
                type: 'url',
                source: 'manual',
                summary: 'Cloudflare Workers的深度解析文章，介绍了边缘计算的优势',
                keywords: ['Cloudflare', 'Workers', '边缘计算'],
                tags: ['技术', 'Cloudflare', '边缘计算'],
                sentiment: 0.5,
                category: '技术文章',
                importance: 0.9,
                word_count: 1200,
                reading_time: 5,
                extractedTitle: 'Cloudflare Workers: 边缘计算的未来',
                created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '3',
                content: '刚刚想到一个创业点子：为小企业提供AI驱动的客户服务解决方案，可以大大降低人工成本。',
                type: 'text',
                source: 'manual',
                summary: '关于AI客服创业想法的记录',
                keywords: ['创业', 'AI客服', '小企业'],
                tags: ['创业想法', 'AI', '客服'],
                sentiment: 0.8,
                category: '创业灵感',
                importance: 0.7,
                word_count: 38,
                reading_time: 1,
                created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        this.tags = [
            { id: '1', name: '产品设计', color: '#3B82F6', count: 1, description: '产品设计相关内容' },
            { id: '2', name: 'AI', color: '#10B981', count: 3, description: 'AI技术相关' },
            { id: '3', name: '用户体验', color: '#F59E0B', count: 1, description: '用户体验设计' },
            { id: '4', name: '技术', color: '#8B5CF6', count: 1, description: '技术相关内容' },
            { id: '5', name: 'Cloudflare', color: '#EF4444', count: 1, description: 'Cloudflare相关' },
            { id: '6', name: '创业想法', color: '#06B6D4', count: 1, description: '创业相关想法' }
        ];
    }
    
    // 模拟API延迟
    async delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // 获取统计数据
    async getStats() {
        await this.delay(300);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayContents = this.contents.filter(content => {
            const contentDate = new Date(content.created_at);
            contentDate.setHours(0, 0, 0, 0);
            return contentDate.getTime() === today.getTime();
        });
        
        const avgSentiment = this.contents.reduce((sum, content) => sum + content.sentiment, 0) / this.contents.length;
        
        return {
            success: true,
            data: {
                total_contents: this.contents.length,
                today_contents: todayContents.length,
                total_tags: this.tags.length,
                avg_sentiment: avgSentiment
            }
        };
    }
    
    // 获取内容列表
    async getContents(page = 1, limit = 10, category = '', search = '') {
        await this.delay(400);
        
        let filteredContents = [...this.contents];
        
        // 分类过滤
        if (category && category !== 'all') {
            filteredContents = filteredContents.filter(content => 
                content.category === category
            );
        }
        
        // 搜索过滤
        if (search) {
            const searchLower = search.toLowerCase();
            filteredContents = filteredContents.filter(content => 
                content.content.toLowerCase().includes(searchLower) ||
                content.summary.toLowerCase().includes(searchLower) ||
                content.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }
        
        // 排序（最新的在前）
        filteredContents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedContents = filteredContents.slice(startIndex, endIndex);
        
        return {
            success: true,
            data: {
                contents: paginatedContents,
                total: filteredContents.length,
                page,
                limit,
                total_pages: Math.ceil(filteredContents.length / limit)
            }
        };
    }
    
    // 获取标签列表
    async getTags() {
        await this.delay(200);
        
        return {
            success: true,
            data: this.tags
        };
    }
    
    // 提交内容
    async submitContent(data) {
        await this.delay(800); // 模拟AI分析时间
        
        const newContent = {
            id: String(this.contents.length + 1),
            content: data.content,
            type: data.type || 'text',
            source: 'manual',
            summary: this.generateMockSummary(data.content, data.type),
            keywords: this.generateMockKeywords(data.content),
            tags: this.generateMockTags(data.content),
            sentiment: Math.random() * 2 - 1, // -1 到 1 之间
            category: this.generateMockCategory(data.content),
            importance: Math.random(),
            word_count: data.content.length,
            reading_time: Math.ceil(data.content.length / 200),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // 如果是URL类型，添加提取的标题
        if (data.type === 'url') {
            newContent.extractedTitle = '模拟提取的网页标题';
        }
        
        this.contents.unshift(newContent);
        
        return {
            success: true,
            data: newContent
        };
    }
    
    // 生成模拟摘要
    generateMockSummary(content, type) {
        if (type === 'url') {
            return '这是一个网页链接的模拟摘要，展示了主要内容概述。';
        }
        
        const words = content.split(' ');
        if (words.length <= 10) {
            return content;
        }
        
        return words.slice(0, 10).join(' ') + '...';
    }
    
    // 生成模拟关键词
    generateMockKeywords(content) {
        const commonKeywords = ['技术', '产品', '设计', '创新', '思考', 'AI', '用户', '体验'];
        return commonKeywords.slice(0, Math.floor(Math.random() * 3) + 2);
    }
    
    // 生成模拟标签
    generateMockTags(content) {
        const availableTags = this.tags.map(tag => tag.name);
        const numTags = Math.floor(Math.random() * 3) + 1;
        const shuffled = availableTags.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, numTags);
    }
    
    // 生成模拟分类
    generateMockCategory(content) {
        const categories = ['技术文章', '产品思考', '创业灵感', '学习笔记', '工作总结'];
        return categories[Math.floor(Math.random() * categories.length)];
    }
}

// 创建全局模拟API实例
window.mockAPI = new MockAPI();

// 模拟fetch函数
const originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
    // 如果是API调用，使用模拟数据
    if (url.startsWith('/api/')) {
        const method = options.method || 'GET';
        const path = url.replace('/api/', '');
        
        try {
            switch (path) {
                case 'stats':
                    return {
                        ok: true,
                        json: () => window.mockAPI.getStats()
                    };
                    
                case 'contents':
                    const urlParams = new URLSearchParams(url.split('?')[1] || '');
                    return {
                        ok: true,
                        json: () => window.mockAPI.getContents(
                            parseInt(urlParams.get('page')) || 1,
                            parseInt(urlParams.get('limit')) || 10,
                            urlParams.get('category') || '',
                            urlParams.get('search') || ''
                        )
                    };
                    
                case 'tags':
                    return {
                        ok: true,
                        json: () => window.mockAPI.getTags()
                    };
                    
                case 'content':
                    if (method === 'POST') {
                        const data = JSON.parse(options.body);
                        return {
                            ok: true,
                            json: () => window.mockAPI.submitContent(data)
                        };
                    }
                    break;
                    
                default:
                    return {
                        ok: false,
                        json: () => Promise.resolve({ success: false, error: 'API endpoint not found' })
                    };
            }
        } catch (error) {
            return {
                ok: false,
                json: () => Promise.resolve({ success: false, error: error.message })
            };
        }
    }
    
    // 对于非API调用，使用原始fetch
    return originalFetch.call(this, url, options);
};

console.log('🎭 Mock API initialized - Demo mode active');