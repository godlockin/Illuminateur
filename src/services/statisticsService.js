/**
 * 统计服务 - 数据统计和分析
 */

import { getTagStatistics, generateTagStatistics, getDatabaseStats } from './databaseService.js';

/**
 * 获取统计信息
 * @param {Object} db - D1数据库实例
 * @param {string} period - 统计周期 ('daily', 'weekly', 'monthly')
 * @param {number} days - 统计天数
 * @returns {Object} 统计结果
 */
export async function getStatistics(db, period = 'daily', days = 7) {
  try {
    const [tagStats, contentStats, overviewStats] = await Promise.all([
      getTagStatistics(db, period, days),
      getContentStatistics(db, days),
      getDatabaseStats(db)
    ]);
    
    return {
      period: period,
      days: days,
      overview: overviewStats,
      contentStats: contentStats,
      tagStats: tagStats,
      trends: await calculateTrends(db, period, days),
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Get statistics error:', error);
    throw error;
  }
}

/**
 * 获取内容统计
 * @param {Object} db - D1数据库实例
 * @param {number} days - 统计天数
 * @returns {Object} 内容统计
 */
async function getContentStatistics(db, days = 7) {
  try {
    // 按内容类型统计
    const typeStats = await db.prepare(`
      SELECT 
        content_type,
        COUNT(*) as count,
        COUNT(CASE WHEN created_at >= date('now', '-' || ? || ' days') THEN 1 END) as recent_count
      FROM contents
      GROUP BY content_type
      ORDER BY count DESC
    `).bind(days).all();
    
    // 按日期统计（最近N天）
    const dailyStats = await db.prepare(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN content_type = 'text' THEN 1 END) as text_count,
        COUNT(CASE WHEN content_type = 'url' THEN 1 END) as url_count,
        COUNT(CASE WHEN content_type = 'image' THEN 1 END) as image_count
      FROM contents
      WHERE created_at >= date('now', '-' || ? || ' days')
      GROUP BY date(created_at)
      ORDER BY date DESC
    `).bind(days).all();
    
    // 处理质量统计
    const qualityStats = await db.prepare(`
      SELECT 
        AVG(length(extracted_text)) as avg_text_length,
        AVG(length(summary)) as avg_summary_length,
        COUNT(CASE WHEN chinese_text IS NOT NULL AND chinese_text != '' THEN 1 END) as translated_count,
        COUNT(CASE WHEN summary IS NOT NULL AND summary != '' THEN 1 END) as summarized_count
      FROM contents
      WHERE created_at >= date('now', '-' || ? || ' days')
    `).bind(days).first();
    
    return {
      byType: typeStats.results || [],
      byDate: dailyStats.results || [],
      quality: qualityStats || {},
      totalProcessed: (typeStats.results || []).reduce((sum, item) => sum + item.recent_count, 0)
    };
    
  } catch (error) {
    console.error('Get content statistics error:', error);
    throw error;
  }
}

/**
 * 计算趋势数据
 * @param {Object} db - D1数据库实例
 * @param {string} period - 统计周期
 * @param {number} days - 统计天数
 * @returns {Object} 趋势数据
 */
async function calculateTrends(db, period, days) {
  try {
    const currentPeriodDays = days;
    const previousPeriodDays = days * 2;
    
    // 当前周期统计
    const currentStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_content,
        COUNT(DISTINCT content_type) as content_types,
        AVG(length(extracted_text)) as avg_length
      FROM contents
      WHERE created_at >= date('now', '-' || ? || ' days')
    `).bind(currentPeriodDays).first();
    
    // 上一周期统计
    const previousStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_content,
        COUNT(DISTINCT content_type) as content_types,
        AVG(length(extracted_text)) as avg_length
      FROM contents
      WHERE created_at >= date('now', '-' || ? || ' days')
        AND created_at < date('now', '-' || ? || ' days')
    `).bind(previousPeriodDays, currentPeriodDays).first();
    
    // 计算变化率
    const contentTrend = calculatePercentageChange(
      currentStats.total_content, 
      previousStats.total_content
    );
    
    const lengthTrend = calculatePercentageChange(
      currentStats.avg_length, 
      previousStats.avg_length
    );
    
    // 标签使用趋势
    const tagTrend = await calculateTagTrend(db, currentPeriodDays);
    
    return {
      content: {
        current: currentStats.total_content,
        previous: previousStats.total_content,
        change: contentTrend
      },
      avgLength: {
        current: Math.round(currentStats.avg_length || 0),
        previous: Math.round(previousStats.avg_length || 0),
        change: lengthTrend
      },
      tags: tagTrend
    };
    
  } catch (error) {
    console.error('Calculate trends error:', error);
    return {
      content: { current: 0, previous: 0, change: 0 },
      avgLength: { current: 0, previous: 0, change: 0 },
      tags: { current: 0, previous: 0, change: 0 }
    };
  }
}

/**
 * 计算标签使用趋势
 * @param {Object} db - D1数据库实例
 * @param {number} days - 天数
 * @returns {Object} 标签趋势
 */
async function calculateTagTrend(db, days) {
  try {
    const currentTagUsage = await db.prepare(`
      SELECT COUNT(DISTINCT ct.tag_id) as unique_tags
      FROM content_tags ct
      JOIN contents c ON ct.content_id = c.id
      WHERE c.created_at >= date('now', '-' || ? || ' days')
    `).bind(days).first();
    
    const previousTagUsage = await db.prepare(`
      SELECT COUNT(DISTINCT ct.tag_id) as unique_tags
      FROM content_tags ct
      JOIN contents c ON ct.content_id = c.id
      WHERE c.created_at >= date('now', '-' || ? || ' days')
        AND c.created_at < date('now', '-' || ? || ' days')
    `).bind(days * 2, days).first();
    
    const change = calculatePercentageChange(
      currentTagUsage.unique_tags,
      previousTagUsage.unique_tags
    );
    
    return {
      current: currentTagUsage.unique_tags,
      previous: previousTagUsage.unique_tags,
      change: change
    };
    
  } catch (error) {
    console.error('Calculate tag trend error:', error);
    return { current: 0, previous: 0, change: 0 };
  }
}

/**
 * 计算百分比变化
 * @param {number} current - 当前值
 * @param {number} previous - 之前值
 * @returns {number} 百分比变化
 */
function calculatePercentageChange(current, previous) {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * 生成统计报告
 * @param {Object} db - D1数据库实例
 * @param {string} period - 统计周期
 * @returns {Object} 统计报告
 */
export async function generateStatistics(db, period = 'daily') {
  try {
    console.log(`Generating ${period} statistics...`);
    
    // 生成标签统计
    await generateTagStatistics(db, period);
    
    // 生成内容统计快照
    await generateContentSnapshot(db, period);
    
    console.log(`${period} statistics generated successfully`);
    return true;
    
  } catch (error) {
    console.error('Generate statistics error:', error);
    throw error;
  }
}

/**
 * 生成内容统计快照
 * @param {Object} db - D1数据库实例
 * @param {string} period - 统计周期
 * @returns {boolean} 操作是否成功
 */
async function generateContentSnapshot(db, period) {
  try {
    const today = new Date().toISOString().split('T')[0];
    let dateCondition = '';
    
    if (period === 'daily') {
      dateCondition = "date(created_at) = date('now')";
    } else if (period === 'weekly') {
      dateCondition = "date(created_at) >= date('now', '-7 days')";
    }
    
    // 这里可以创建一个内容统计快照表，用于历史数据分析
    // 由于当前schema中没有定义，我们先记录到日志
    const stats = await db.prepare(`
      SELECT 
        content_type,
        COUNT(*) as count,
        AVG(length(extracted_text)) as avg_length
      FROM contents
      WHERE ${dateCondition}
      GROUP BY content_type
    `).all();
    
    console.log(`Content snapshot for ${period} (${today}):`, stats.results);
    return true;
    
  } catch (error) {
    console.error('Generate content snapshot error:', error);
    throw error;
  }
}

/**
 * 获取高级分析数据
 * @param {Object} db - D1数据库实例
 * @param {Object} options - 分析选项
 * @returns {Object} 分析结果
 */
export async function getAdvancedAnalytics(db, options = {}) {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate = new Date().toISOString().split('T')[0],
      groupBy = 'day'
    } = options;
    
    // 内容处理效率分析
    const efficiencyStats = await getProcessingEfficiency(db, startDate, endDate);
    
    // 标签分布分析
    const tagDistribution = await getTagDistribution(db, startDate, endDate);
    
    // 内容质量分析
    const qualityAnalysis = await getContentQualityAnalysis(db, startDate, endDate);
    
    // 用户行为分析（基于内容创建模式）
    const usagePatterns = await getUsagePatterns(db, startDate, endDate, groupBy);
    
    return {
      dateRange: { startDate, endDate },
      efficiency: efficiencyStats,
      tagDistribution: tagDistribution,
      quality: qualityAnalysis,
      usagePatterns: usagePatterns,
      generatedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Get advanced analytics error:', error);
    throw error;
  }
}

/**
 * 获取处理效率统计
 * @param {Object} db - D1数据库实例
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {Object} 效率统计
 */
async function getProcessingEfficiency(db, startDate, endDate) {
  try {
    const stats = await db.prepare(`
      SELECT 
        content_type,
        COUNT(*) as total_processed,
        COUNT(CASE WHEN chinese_text IS NOT NULL AND chinese_text != '' THEN 1 END) as translation_success,
        COUNT(CASE WHEN summary IS NOT NULL AND summary != '' THEN 1 END) as summary_success,
        AVG(length(extracted_text)) as avg_extracted_length
      FROM contents
      WHERE date(created_at) BETWEEN ? AND ?
      GROUP BY content_type
    `).bind(startDate, endDate).all();
    
    return (stats.results || []).map(stat => ({
      ...stat,
      translation_rate: stat.total_processed > 0 ? 
        Math.round((stat.translation_success / stat.total_processed) * 100) : 0,
      summary_rate: stat.total_processed > 0 ? 
        Math.round((stat.summary_success / stat.total_processed) * 100) : 0
    }));
    
  } catch (error) {
    console.error('Get processing efficiency error:', error);
    return [];
  }
}

/**
 * 获取标签分布
 * @param {Object} db - D1数据库实例
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {Array} 标签分布
 */
async function getTagDistribution(db, startDate, endDate) {
  try {
    const distribution = await db.prepare(`
      SELECT 
        t.category,
        COUNT(ct.id) as usage_count,
        COUNT(DISTINCT t.id) as unique_tags,
        AVG(ct.confidence) as avg_confidence
      FROM tags t
      JOIN content_tags ct ON t.id = ct.tag_id
      JOIN contents c ON ct.content_id = c.id
      WHERE date(c.created_at) BETWEEN ? AND ?
      GROUP BY t.category
      ORDER BY usage_count DESC
    `).bind(startDate, endDate).all();
    
    return distribution.results || [];
    
  } catch (error) {
    console.error('Get tag distribution error:', error);
    return [];
  }
}

/**
 * 获取内容质量分析
 * @param {Object} db - D1数据库实例
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {Object} 质量分析
 */
async function getContentQualityAnalysis(db, startDate, endDate) {
  try {
    const analysis = await db.prepare(`
      SELECT 
        AVG(length(extracted_text)) as avg_text_length,
        AVG(length(chinese_text)) as avg_chinese_length,
        AVG(length(english_text)) as avg_english_length,
        AVG(length(summary)) as avg_summary_length,
        MIN(length(extracted_text)) as min_text_length,
        MAX(length(extracted_text)) as max_text_length,
        COUNT(CASE WHEN length(extracted_text) < 100 THEN 1 END) as short_content_count,
        COUNT(CASE WHEN length(extracted_text) > 1000 THEN 1 END) as long_content_count
      FROM contents
      WHERE date(created_at) BETWEEN ? AND ?
        AND extracted_text IS NOT NULL
    `).bind(startDate, endDate).first();
    
    return {
      averageLengths: {
        extracted: Math.round(analysis.avg_text_length || 0),
        chinese: Math.round(analysis.avg_chinese_length || 0),
        english: Math.round(analysis.avg_english_length || 0),
        summary: Math.round(analysis.avg_summary_length || 0)
      },
      lengthRange: {
        min: analysis.min_text_length || 0,
        max: analysis.max_text_length || 0
      },
      distribution: {
        short: analysis.short_content_count || 0,
        long: analysis.long_content_count || 0
      }
    };
    
  } catch (error) {
    console.error('Get content quality analysis error:', error);
    return {
      averageLengths: { extracted: 0, chinese: 0, english: 0, summary: 0 },
      lengthRange: { min: 0, max: 0 },
      distribution: { short: 0, long: 0 }
    };
  }
}

/**
 * 获取使用模式
 * @param {Object} db - D1数据库实例
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @param {string} groupBy - 分组方式
 * @returns {Array} 使用模式
 */
async function getUsagePatterns(db, startDate, endDate, groupBy) {
  try {
    let dateFormat = '';
    
    switch (groupBy) {
      case 'hour':
        dateFormat = "strftime('%Y-%m-%d %H:00:00', created_at)";
        break;
      case 'day':
        dateFormat = "date(created_at)";
        break;
      case 'week':
        dateFormat = "date(created_at, 'weekday 0', '-6 days')";
        break;
      case 'month':
        dateFormat = "strftime('%Y-%m-01', created_at)";
        break;
      default:
        dateFormat = "date(created_at)";
    }
    
    const patterns = await db.prepare(`
      SELECT 
        ${dateFormat} as period,
        COUNT(*) as total_count,
        COUNT(CASE WHEN content_type = 'text' THEN 1 END) as text_count,
        COUNT(CASE WHEN content_type = 'url' THEN 1 END) as url_count,
        COUNT(CASE WHEN content_type = 'image' THEN 1 END) as image_count
      FROM contents
      WHERE date(created_at) BETWEEN ? AND ?
      GROUP BY ${dateFormat}
      ORDER BY period
    `).bind(startDate, endDate).all();
    
    return patterns.results || [];
    
  } catch (error) {
    console.error('Get usage patterns error:', error);
    return [];
  }
}