/**
 * 搜索服务 - 内容搜索和检索
 */

import { searchContents as dbSearchContents, getContentById as dbGetContentById } from './databaseService.js';

/**
 * 搜索内容
 * @param {Object} db - D1数据库实例
 * @param {string} query - 搜索查询
 * @param {number} limit - 限制数量
 * @param {number} offset - 偏移量
 * @param {Object} filters - 搜索过滤器
 * @returns {Object} 搜索结果
 */
export async function searchContents(db, query, limit = 20, offset = 0, filters = {}) {
  try {
    // 基础搜索
    let results = await dbSearchContents(db, query, limit, offset);
    
    // 应用额外的过滤器
    if (filters.contentType) {
      results = await filterByContentType(db, query, filters.contentType, limit, offset);
    }
    
    if (filters.dateRange) {
      results = await filterByDateRange(db, query, filters.dateRange, limit, offset);
    }
    
    if (filters.tags) {
      results = await filterByTags(db, query, filters.tags, limit, offset);
    }
    
    // 增强搜索结果
    const enhancedResults = await enhanceSearchResults(db, results.items);
    
    return {
      ...results,
      items: enhancedResults,
      query: query,
      filters: filters
    };
    
  } catch (error) {
    console.error('Search service error:', error);
    throw error;
  }
}

/**
 * 根据内容类型过滤
 * @param {Object} db - D1数据库实例
 * @param {string} query - 搜索查询
 * @param {string} contentType - 内容类型
 * @param {number} limit - 限制数量
 * @param {number} offset - 偏移量
 * @returns {Object} 过滤结果
 */
async function filterByContentType(db, query, contentType, limit, offset) {
  try {
    let whereClause = 'WHERE content_type = ?';
    let params = [contentType];
    
    if (query && query.trim()) {
      whereClause += ` AND (
        original_content LIKE ? OR 
        extracted_text LIKE ? OR 
        chinese_text LIKE ? OR 
        english_text LIKE ? OR 
        summary LIKE ?
      )`;
      const searchTerm = `%${query.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // 获取总数
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM contents ${whereClause}
    `);
    const countResult = await countStmt.bind(...params).first();
    
    // 获取结果
    const stmt = db.prepare(`
      SELECT 
        id, content_type, original_content, summary,
        created_at, updated_at
      FROM contents 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    
    const results = await stmt.bind(...params, limit, offset).all();
    
    return {
      total: countResult.total,
      items: results.results || [],
      limit: limit,
      offset: offset,
      hasMore: (offset + limit) < countResult.total
    };
    
  } catch (error) {
    console.error('Filter by content type error:', error);
    throw error;
  }
}

/**
 * 根据日期范围过滤
 * @param {Object} db - D1数据库实例
 * @param {string} query - 搜索查询
 * @param {Object} dateRange - 日期范围 {start, end}
 * @param {number} limit - 限制数量
 * @param {number} offset - 偏移量
 * @returns {Object} 过滤结果
 */
async function filterByDateRange(db, query, dateRange, limit, offset) {
  try {
    let whereClause = 'WHERE created_at >= ? AND created_at <= ?';
    let params = [dateRange.start, dateRange.end];
    
    if (query && query.trim()) {
      whereClause += ` AND (
        original_content LIKE ? OR 
        extracted_text LIKE ? OR 
        chinese_text LIKE ? OR 
        english_text LIKE ? OR 
        summary LIKE ?
      )`;
      const searchTerm = `%${query.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // 获取总数
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM contents ${whereClause}
    `);
    const countResult = await countStmt.bind(...params).first();
    
    // 获取结果
    const stmt = db.prepare(`
      SELECT 
        id, content_type, original_content, summary,
        created_at, updated_at
      FROM contents 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    
    const results = await stmt.bind(...params, limit, offset).all();
    
    return {
      total: countResult.total,
      items: results.results || [],
      limit: limit,
      offset: offset,
      hasMore: (offset + limit) < countResult.total
    };
    
  } catch (error) {
    console.error('Filter by date range error:', error);
    throw error;
  }
}

/**
 * 根据标签过滤
 * @param {Object} db - D1数据库实例
 * @param {string} query - 搜索查询
 * @param {Array} tags - 标签数组
 * @param {number} limit - 限制数量
 * @param {number} offset - 偏移量
 * @returns {Object} 过滤结果
 */
async function filterByTags(db, query, tags, limit, offset) {
  try {
    const tagPlaceholders = tags.map(() => '?').join(',');
    let whereClause = `
      WHERE c.id IN (
        SELECT DISTINCT ct.content_id 
        FROM content_tags ct 
        JOIN tags t ON ct.tag_id = t.id 
        WHERE t.name IN (${tagPlaceholders})
      )
    `;
    let params = [...tags];
    
    if (query && query.trim()) {
      whereClause += ` AND (
        c.original_content LIKE ? OR 
        c.extracted_text LIKE ? OR 
        c.chinese_text LIKE ? OR 
        c.english_text LIKE ? OR 
        c.summary LIKE ?
      )`;
      const searchTerm = `%${query.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // 获取总数
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM contents c ${whereClause}
    `);
    const countResult = await countStmt.bind(...params).first();
    
    // 获取结果
    const stmt = db.prepare(`
      SELECT 
        c.id, c.content_type, c.original_content, c.summary,
        c.created_at, c.updated_at
      FROM contents c
      ${whereClause}
      ORDER BY c.created_at DESC 
      LIMIT ? OFFSET ?
    `);
    
    const results = await stmt.bind(...params, limit, offset).all();
    
    return {
      total: countResult.total,
      items: results.results || [],
      limit: limit,
      offset: offset,
      hasMore: (offset + limit) < countResult.total
    };
    
  } catch (error) {
    console.error('Filter by tags error:', error);
    throw error;
  }
}

/**
 * 增强搜索结果
 * @param {Object} db - D1数据库实例
 * @param {Array} items - 搜索结果项
 * @returns {Array} 增强后的结果
 */
async function enhanceSearchResults(db, items) {
  try {
    const enhancedItems = [];
    
    for (const item of items) {
      // 获取关联的标签
      const tags = await db.prepare(`
        SELECT t.name, t.category, ct.confidence
        FROM tags t
        JOIN content_tags ct ON t.id = ct.tag_id
        WHERE ct.content_id = ?
        ORDER BY ct.confidence DESC
        LIMIT 5
      `).bind(item.id).all();
      
      enhancedItems.push({
        ...item,
        tags: tags.results || [],
        preview: generatePreview(item.original_content, item.summary)
      });
    }
    
    return enhancedItems;
    
  } catch (error) {
    console.error('Enhance search results error:', error);
    return items; // 返回原始结果
  }
}

/**
 * 生成内容预览
 * @param {string} originalContent - 原始内容
 * @param {string} summary - 摘要
 * @returns {string} 预览文本
 */
function generatePreview(originalContent, summary) {
  if (summary && summary.length > 0) {
    return summary.length > 150 ? summary.substring(0, 150) + '...' : summary;
  }
  
  if (originalContent && originalContent.length > 0) {
    return originalContent.length > 150 ? originalContent.substring(0, 150) + '...' : originalContent;
  }
  
  return '暂无预览';
}

/**
 * 获取内容详情
 * @param {Object} db - D1数据库实例
 * @param {number} contentId - 内容ID
 * @returns {Object} 内容详情
 */
export async function getContentById(db, contentId) {
  try {
    return await dbGetContentById(db, contentId);
  } catch (error) {
    console.error('Get content by ID error:', error);
    throw error;
  }
}

/**
 * 获取相关内容推荐
 * @param {Object} db - D1数据库实例
 * @param {number} contentId - 当前内容ID
 * @param {number} limit - 推荐数量
 * @returns {Array} 相关内容列表
 */
export async function getRelatedContents(db, contentId, limit = 5) {
  try {
    // 基于标签相似性推荐
    const stmt = db.prepare(`
      SELECT DISTINCT 
        c.id, c.content_type, c.original_content, c.summary,
        c.created_at, COUNT(ct2.tag_id) as common_tags
      FROM contents c
      JOIN content_tags ct2 ON c.id = ct2.content_id
      WHERE ct2.tag_id IN (
        SELECT ct1.tag_id 
        FROM content_tags ct1 
        WHERE ct1.content_id = ?
      )
      AND c.id != ?
      GROUP BY c.id
      ORDER BY common_tags DESC, c.created_at DESC
      LIMIT ?
    `);
    
    const results = await stmt.bind(contentId, contentId, limit).all();
    return results.results || [];
    
  } catch (error) {
    console.error('Get related contents error:', error);
    return [];
  }
}

/**
 * 获取热门标签
 * @param {Object} db - D1数据库实例
 * @param {number} limit - 标签数量
 * @param {number} days - 统计天数
 * @returns {Array} 热门标签列表
 */
export async function getPopularTags(db, limit = 10, days = 30) {
  try {
    const stmt = db.prepare(`
      SELECT 
        t.name, t.category, COUNT(ct.id) as usage_count
      FROM tags t
      JOIN content_tags ct ON t.id = ct.tag_id
      JOIN contents c ON ct.content_id = c.id
      WHERE c.created_at >= date('now', '-' || ? || ' days')
      GROUP BY t.id, t.name, t.category
      ORDER BY usage_count DESC
      LIMIT ?
    `);
    
    const results = await stmt.bind(days, limit).all();
    return results.results || [];
    
  } catch (error) {
    console.error('Get popular tags error:', error);
    return [];
  }
}

/**
 * 全文搜索建议
 * @param {Object} db - D1数据库实例
 * @param {string} query - 搜索查询
 * @param {number} limit - 建议数量
 * @returns {Array} 搜索建议列表
 */
export async function getSearchSuggestions(db, query, limit = 5) {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const searchTerm = `%${query.trim()}%`;
    
    // 从标签中获取建议
    const tagSuggestions = await db.prepare(`
      SELECT DISTINCT name as suggestion, 'tag' as type
      FROM tags 
      WHERE name LIKE ?
      ORDER BY name
      LIMIT ?
    `).bind(searchTerm, Math.ceil(limit / 2)).all();
    
    // 从内容摘要中获取建议
    const contentSuggestions = await db.prepare(`
      SELECT DISTINCT 
        CASE 
          WHEN length(summary) > 50 THEN substr(summary, 1, 50) || '...'
          ELSE summary
        END as suggestion,
        'content' as type
      FROM contents 
      WHERE summary LIKE ? AND summary IS NOT NULL
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(searchTerm, Math.floor(limit / 2)).all();
    
    const suggestions = [
      ...(tagSuggestions.results || []),
      ...(contentSuggestions.results || [])
    ];
    
    return suggestions.slice(0, limit);
    
  } catch (error) {
    console.error('Get search suggestions error:', error);
    return [];
  }
}