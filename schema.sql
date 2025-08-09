-- 内容存储表
CREATE TABLE IF NOT EXISTS contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL, -- 'text', 'url', 'image'
    original_content TEXT NOT NULL, -- 原始内容或URL
    extracted_text TEXT, -- 提取的文本内容
    chinese_text TEXT, -- 中文版本
    english_text TEXT, -- 英文版本
    summary TEXT, -- 摘要
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    category TEXT, -- 标签分类
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 内容标签关联表
CREATE TABLE IF NOT EXISTS content_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    confidence REAL DEFAULT 1.0, -- 标签置信度
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(content_id, tag_id)
);

-- 统计表（用于每日/每周统计）
CREATE TABLE IF NOT EXISTS tag_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id INTEGER NOT NULL,
    period_type TEXT NOT NULL, -- 'daily', 'weekly'
    period_date DATE NOT NULL, -- 统计日期
    count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(tag_id, period_type, period_date)
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents(created_at);
CREATE INDEX IF NOT EXISTS idx_contents_type ON contents(content_type);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_content_tags_content ON content_tags(content_id);
CREATE INDEX IF NOT EXISTS idx_content_tags_tag ON content_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_statistics_period ON tag_statistics(period_type, period_date);