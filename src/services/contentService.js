/**
 * 内容处理服务 - 核心业务逻辑
 */

import { extractTextFromUrl } from './urlService.js';
import { extractTextFromImage } from './ocrService.js';
import { translateAndNormalize, summarizeText, generateTags } from './aiService.js';
import { saveContent, saveTags, linkContentTags } from './databaseService.js';

/**
 * 处理内容的主函数
 * @param {Object} input - 输入内容
 * @param {string} input.type - 内容类型: 'text', 'url', 'image'
 * @param {string} input.content - 文本内容或URL
 * @param {File} input.file - 图片文件
 * @param {Object} env - Cloudflare环境变量
 * @returns {Object} 处理结果
 */
export async function processContent(input, env) {
  try {
    let extractedText = '';
    let originalContent = input.content || '';
    
    // 第一步：根据内容类型提取文本
    switch (input.type) {
      case 'text':
        extractedText = input.content;
        break;
        
      case 'url':
        console.log('Processing URL:', input.content);
        const urlResult = await extractTextFromUrl(input.content);
        extractedText = urlResult.text;
        originalContent = input.content;
        break;
        
      case 'image':
        console.log('Processing image file');
        if (!input.file) {
          throw new Error('No image file provided');
        }
        const imageBuffer = await input.file.arrayBuffer();
        const ocrResult = await extractTextFromImage(imageBuffer);
        extractedText = ocrResult.text;
        originalContent = `[Image: ${input.file.name || 'uploaded-image'}]`;
        break;
        
      default:
        throw new Error(`Unsupported content type: ${input.type}`);
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content extracted');
    }
    
    console.log('Extracted text length:', extractedText.length);
    
    // 第二步：AI处理 - 翻译、总结、标记
    console.log('Starting AI processing...');
    const [translationResult, summary, tags] = await Promise.all([
      translateAndNormalize(extractedText, env),
      summarizeText(extractedText, env),
      generateTags(extractedText, env)
    ]);
    
    console.log('AI processing completed');
    
    // 第三步：保存到数据库
    const contentData = {
      content_type: input.type,
      original_content: originalContent,
      extracted_text: extractedText,
      chinese_text: translationResult.chinese,
      english_text: translationResult.english,
      summary: summary
    };
    
    const contentId = await saveContent(env.DB, contentData);
    console.log('Content saved with ID:', contentId);
    
    // 保存标签
    if (tags && tags.length > 0) {
      const tagIds = await saveTags(env.DB, tags);
      await linkContentTags(env.DB, contentId, tagIds);
      console.log('Tags saved and linked:', tags.length);
    }
    
    // 返回处理结果
    return {
      success: true,
      contentId: contentId,
      data: {
        originalContent: originalContent,
        extractedText: extractedText,
        translations: {
          chinese: translationResult.chinese,
          english: translationResult.english
        },
        summary: summary,
        tags: tags,
        contentType: input.type,
        createdAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Content processing error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * 批量处理内容
 * @param {Array} inputs - 输入内容数组
 * @param {Object} env - Cloudflare环境变量
 * @returns {Array} 处理结果数组
 */
export async function batchProcessContent(inputs, env) {
  const results = [];
  
  for (const input of inputs) {
    try {
      const result = await processContent(input, env);
      results.push(result);
    } catch (error) {
      console.error(`Batch processing error for input ${input.type}:`, error);
      results.push({
        success: false,
        error: error.message,
        data: null
      });
    }
  }
  
  return results;
}

/**
 * 验证输入内容
 * @param {Object} input - 输入内容
 * @returns {Object} 验证结果
 */
export function validateInput(input) {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid input format' };
  }
  
  if (!input.type || !['text', 'url', 'image'].includes(input.type)) {
    return { valid: false, error: 'Invalid or missing content type' };
  }
  
  if (input.type === 'text' && (!input.content || input.content.trim().length === 0)) {
    return { valid: false, error: 'Text content is required' };
  }
  
  if (input.type === 'url' && (!input.content || !isValidUrl(input.content))) {
    return { valid: false, error: 'Valid URL is required' };
  }
  
  if (input.type === 'image' && !input.file) {
    return { valid: false, error: 'Image file is required' };
  }
  
  return { valid: true };
}

/**
 * 验证URL格式
 * @param {string} url - URL字符串
 * @returns {boolean} 是否为有效URL
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}