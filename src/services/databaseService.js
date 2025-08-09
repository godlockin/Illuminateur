/**
 * 数据库服务 - D1数据库操作
 */

/**
 * 保存内容到数据库
 * @param {Object} db - D1数据库实例
 * @param {Object} contentData - 内容数据
 * @returns {number} 内容ID
 */
export async function saveContent(db, contentData) {
  try {
    const stmt = db.prepare(`
      INSERT INTO contents (
        content_type, original_content, extracted_text, 
        chinese_text, english_text, summary, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const result = await stmt.bind(
      contentData.content_type,
      contentData.original_content,
      contentData.extracted_text,
      contentData.chinese_text,
      contentData.english_text,
      contentData.summary
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to save content to database');
    }
    
    console.log('Content saved with ID:', result.meta.last_row_id);
    return result.meta.last_row_id;
    
  } catch (error) {
    console.error('Save content error:', error);
    throw error;
  }
}

/**
 * 保存标签到数据库
 * @param {Object} db - D1数据库实例
 * @param {Array} tags - 标签数组
 * @returns {Array} 标签ID数组
 */
export async function saveTags(db, tags) {
  if (!tags || tags.length === 0) {
    return [];
  }
  
  const tagIds = [];
  
  try {
    for (const tag of tags) {
      // 检查标签是否已存在
      const existingTag = await db.prepare(
        'SELECT id FROM tags WHERE name = ?'
      ).bind(tag.name).first();
      
      if (existingTag) {
        tagIds.push({
          id: existingTag.id,
          confidence: tag.confidence || 1.0
        });
      } else {
        // 创建新标签
        const stmt = db.prepare(`
          INSERT INTO tags (name, category, created_at) 
          VALUES (?, ?, datetime('now'))
        `);
        
        const result = await stmt.bind(
          tag.name,
          tag.category || '通用'
        ).run();
        
        if (result.success) {
          tagIds.push({
            id: result.meta.last_row_id,
            confidence: tag.confidence || 1.0
          });
        }
      }
    }
    
    console.log('Tags processed:', tagIds.length);
    return tagIds;
    
  } catch (error) {
    console.error('Save tags error:', error);
    throw error;
  }
}

/**
 * 关联内容和标签
 * @param {Object} db - D1数据库实例
 * @param {number} contentId - 内容ID
 * @param {Array} tagIds - 标签ID数组（包含置信度）
 * @returns {boolean} 操作是否成功
 */
export async function linkContentTags(db, contentId, tagIds) {
  if (!tagIds || tagIds.length === 0) {
    return true;
  }
  
  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO content_tags 
      (content_id, tag_id, confidence, created_at) 
      VALUES (?, ?, ?, datetime('now'))
    `);
    
    for (const tagData of tagIds) {
      await stmt.bind(
        contentId,
        tagData.id,
        tagData.confidence
      ).run();
    }
    
    console.log('Content-tag links created:', tagIds.length);
    return true;
    
  } catch (error) {
    console.error('Link content tags error:', error);
    throw error;
  }
}

/**
 * 根据ID获取内容
 * @param {Object} db - D1数据库实例
 * @param {number} contentId - 内容ID
 * @returns {Object} 内容详情
 */
export async function getContentById(db, contentId) {
  try {
    const content = await db.prepare(`
      SELECT * FROM contents WHERE id = ?
    `).bind(contentId).first();
    
    if (!content) {
      return null;
    }
    
    // 获取关联的标签
    const tags = await db.prepare(`
      SELECT t.id, t.name, t.category, ct.confidence
      FROM tags t
      JOIN content_tags ct ON t.id = ct.tag_id
      WHERE ct.content_id = ?
      ORDER BY ct.confidence DESC
    `).bind(contentId).all();
    
    return {
      ...content,
      tags: tags.results || []
    };
    
  } catch (error) {
    console.error('Get content by ID error:', error);
    throw error;
  }
}

/**
 * 搜索内容
 * @param {Object} db - D1数据库实例
 * @param {string} query - 搜索关键词
 * @param {number} limit - 限制数量
 * @param {number} offset - 偏移量
 * @returns {Object} 搜索结果
 */
export async function searchContents(db, query, limit = 20, offset = 0) {
  try {
    let whereClause = '';
    let params = [];
    
    if (query && query.trim()) {
      whereClause = `
        WHERE 
          original_content LIKE ? OR 
          extracted_text LIKE ? OR 
          chinese_text LIKE ? OR 
          english_text LIKE ? OR 
          summary LIKE ?
      `;
      const searchTerm = `%${query.trim()}%`;
      params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    }
    
    // 获取总数
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM contents ${whereClause}
    `);
    const countResult = await (params.length > 0 ? 
      countStmt.bind(...params).first() : 
      countStmt.first()
    );
    
    // 获取内容列表
    const stmt = db.prepare(`
      SELECT 
        id, content_type, original_content, summary,
        created_at, updated_at
      FROM contents 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    
    const searchParams = params.length > 0 ? 
      [...params, limit, offset] : 
      [limit, offset];
    
    const results = await stmt.bind(...searchParams).all();
    
    return {
      total: countResult.total,
      items: results.results || [],
      limit: limit,
      offset: offset,
      hasMore: (offset + limit) < countResult.total
    };
    
  } catch (error) {
    console.error('Search contents error:', error);
    throw error;
  }
}

/**
 * 获取标签统计
 * @param {Object} db - D1数据库实例
 * @param {string} period - 统计周期 ('daily', 'weekly')
 * @param {number} days - 天数
 * @returns {Array} 统计结果
 */
export async function getTagStatistics(db, period = 'daily', days = 7) {
  try {
    const stmt = db.prepare(`
      SELECT 
        t.name as tag_name,
        t.category,
        ts.period_date,
        ts.count,
        ts.period_type
      FROM tag_statistics ts
      JOIN tags t ON ts.tag_id = t.id
      WHERE ts.period_type = ? 
        AND ts.period_date >= date('now', '-' || ? || ' days')
      ORDER BY ts.period_date DESC, ts.count DESC
    `);
    
    const results = await stmt.bind(period, days).all();
    return results.results || [];
    
  } catch (error) {
    console.error('Get tag statistics error:', error);
    throw error;
  }
}

/**
 * 生成标签统计
 * @param {Object} db - D1数据库实例
 * @param {string} period - 统计周期
 * @returns {boolean} 操作是否成功
 */
export async function generateTagStatistics(db, period = 'daily') {
  try {
    const today = new Date().toISOString().split('T')[0];
    let dateCondition = '';
    
    if (period === 'daily') {
      dateCondition = "date(c.created_at) = date('now')";
    } else if (period === 'weekly') {
      dateCondition = "date(c.created_at) >= date('now', '-7 days')";
    }
    
    // 统计每个标签的使用次数
    const statsStmt = db.prepare(`
      SELECT 
        ct.tag_id,
        COUNT(*) as count
      FROM content_tags ct
      JOIN contents c ON ct.content_id = c.id
      WHERE ${dateCondition}
      GROUP BY ct.tag_id
    `);
    
    const stats = await statsStmt.all();
    
    // 保存统计结果
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO tag_statistics 
      (tag_id, period_type, period_date, count, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    
    for (const stat of stats.results || []) {
      await insertStmt.bind(
        stat.tag_id,
        period,
        today,
        stat.count
      ).run();
    }
    
    console.log(`Generated ${period} statistics for ${stats.results?.length || 0} tags`);
    return true;
    
  } catch (error) {
    console.error('Generate tag statistics error:', error);
    throw error;
  }
}

/**
 * 删除内容
 * @param {Object} db - D1数据库实例
 * @param {number} contentId - 内容ID
 * @returns {boolean} 操作是否成功
 */
export async function deleteContent(db, contentId) {
  try {
    // 由于设置了外键约束，删除内容时会自动删除相关的标签关联
    const stmt = db.prepare('DELETE FROM contents WHERE id = ?');
    const result = await stmt.bind(contentId).run();
    
    return result.success && result.meta.changes > 0;
    
  } catch (error) {
    console.error('Delete content error:', error);
    throw error;
  }
}

/**
 * 更新内容
 * @param {Object} db - D1数据库实例
 * @param {number} contentId - 内容ID
 * @param {Object} updateData - 更新数据
 * @returns {boolean} 操作是否成功
 */
export async function updateContent(db, contentId, updateData) {
  try {
    const fields = [];
    const values = [];
    
    // 构建动态更新语句
    const allowedFields = [
      'extracted_text', 'chinese_text', 'english_text', 'summary'
    ];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    }
    
    if (fields.length === 0) {
      return true; // 没有需要更新的字段
    }
    
    fields.push('updated_at = datetime(\'now\')');
    values.push(contentId);
    
    const stmt = db.prepare(`
      UPDATE contents 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    
    const result = await stmt.bind(...values).run();
    return result.success && result.meta.changes > 0;
    
  } catch (error) {
    console.error('Update content error:', error);
    throw error;
  }
}

/**
 * 获取数据库统计信息
 * @param {Object} db - D1数据库实例
 * @returns {Object} 统计信息
 */
export async function getDatabaseStats(db) {
  try {
    const [contentCount, tagCount, linkCount] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM contents').first(),
      db.prepare('SELECT COUNT(*) as count FROM tags').first(),
      db.prepare('SELECT COUNT(*) as count FROM content_tags').first()
    ]);
    
    return {
      totalContents: contentCount.count,
      totalTags: tagCount.count,
      totalLinks: linkCount.count,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Get database stats error:', error);
    throw error;
  }
}