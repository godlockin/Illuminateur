-- 灵感收集器数据库初始化脚本

-- 内容表：存储用户提交的所有内容
CREATE TABLE IF NOT EXISTS contents (
    id TEXT PRIMARY KEY,
    original_content TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('text', 'url', 'email', 'file')),
    source_info TEXT, -- 来源信息（邮件地址、URL等）
    
    -- AI分析结果
    summary TEXT,
    keywords TEXT, -- JSON数组格式存储
    tags TEXT,     -- JSON数组格式存储
    sentiment REAL, -- 情感分析分数 -1到1
    category TEXT,  -- AI分类结果
    
    -- 元数据
    word_count INTEGER DEFAULT 0,
    reading_time INTEGER DEFAULT 0, -- 预估阅读时间（分钟）
    importance_score REAL DEFAULT 0, -- 重要性评分
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 标签表：管理所有标签
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#3B82F6', -- 标签颜色
    count INTEGER DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 内容标签关联表
CREATE TABLE IF NOT EXISTS content_tags (
    content_id TEXT,
    tag_id TEXT,
    confidence REAL DEFAULT 1.0, -- AI标签的置信度
    is_manual BOOLEAN DEFAULT FALSE, -- 是否手动添加
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (content_id, tag_id),
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 用户配置表
CREATE TABLE IF NOT EXISTS user_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 统计表
CREATE TABLE IF NOT EXISTS stats (
    date TEXT PRIMARY KEY, -- YYYY-MM-DD格式
    total_contents INTEGER DEFAULT 0,
    new_contents INTEGER DEFAULT 0,
    total_words INTEGER DEFAULT 0,
    avg_sentiment REAL DEFAULT 0,
    top_tags TEXT, -- JSON格式存储当日热门标签
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contents_category ON contents(category);
CREATE INDEX IF NOT EXISTS idx_contents_importance ON contents(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_contents_sentiment ON contents(sentiment);
CREATE INDEX IF NOT EXISTS idx_tags_count ON tags(count DESC);
CREATE INDEX IF NOT EXISTS idx_content_tags_content ON content_tags(content_id);
CREATE INDEX IF NOT EXISTS idx_content_tags_tag ON content_tags(tag_id);

-- 插入默认配置
INSERT OR IGNORE INTO user_settings (key, value) VALUES 
('theme', 'light'),
('auto_tag', 'true'),
('email_notifications', 'false'),
('default_view', 'cards'),
('items_per_page', '20');

-- 插入一些预设标签
INSERT OR IGNORE INTO tags (id, name, color, description) VALUES 
('tag_idea', '💡 想法', '#F59E0B', '创意和灵感'),
('tag_article', '📄 文章', '#3B82F6', '文章和博客'),
('tag_quote', '💬 引用', '#8B5CF6', '名言和引用'),
('tag_todo', '✅ 待办', '#10B981', '需要行动的事项'),
('tag_learning', '📚 学习', '#EF4444', '学习资料'),
('tag_work', '💼 工作', '#6B7280', '工作相关'),
('tag_personal', '👤 个人', '#EC4899', '个人生活');