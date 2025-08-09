/**
 * AI服务 - Gemini API集成
 */

/**
 * 调用Gemini API的通用函数
 * @param {string} prompt - 提示词
 * @param {Object} env - 环境变量
 * @returns {string} AI响应
 */
async function callGeminiAPI(prompt, env) {
  const apiKey = env.GEMINI_API_KEY;
  const baseUrl = env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';
  const modelName = env.MODEL_NAME || 'gemini-pro';
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  
  const url = `${baseUrl}/v1/models/${modelName}:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048
    }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }
    
    return data.candidates[0].content.parts[0].text;
    
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

/**
 * 双语翻译归一化
 * @param {string} text - 原始文本
 * @param {Object} env - 环境变量
 * @returns {Object} 包含中英文版本的对象
 */
export async function translateAndNormalize(text, env) {
  const prompt = `请对以下文本进行双语翻译归一化处理：

原文：
${text}

要求：
1. 如果原文是中文，请提供高质量的英文翻译
2. 如果原文是英文，请提供高质量的中文翻译
3. 如果原文是其他语言，请同时提供中文和英文翻译
4. 保持原文的语义和语调
5. 对于专业术语，请保持准确性

请按以下JSON格式返回：
{
  "chinese": "中文版本",
  "english": "English version",
  "original_language": "detected language"
}`;
  
  try {
    const response = await callGeminiAPI(prompt, env);
    
    // 尝试解析JSON响应
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        chinese: result.chinese || text,
        english: result.english || text,
        originalLanguage: result.original_language || 'unknown'
      };
    }
    
    // 如果无法解析JSON，返回原文
    return {
      chinese: text,
      english: text,
      originalLanguage: 'unknown'
    };
    
  } catch (error) {
    console.error('Translation error:', error);
    // 出错时返回原文
    return {
      chinese: text,
      english: text,
      originalLanguage: 'error'
    };
  }
}

/**
 * 文本摘要生成
 * @param {string} text - 原始文本
 * @param {Object} env - 环境变量
 * @returns {string} 摘要文本
 */
export async function summarizeText(text, env) {
  const prompt = `请为以下文本生成一个简洁而全面的摘要：

原文：
${text}

要求：
1. 摘要长度控制在100-200字之间
2. 保留关键信息和要点
3. 使用清晰简洁的语言
4. 如果原文很短（少于100字），可以适当保留更多细节
5. 保持原文的主要语言（中文原文用中文摘要，英文原文用英文摘要）

摘要：`;
  
  try {
    const summary = await callGeminiAPI(prompt, env);
    return summary.trim();
  } catch (error) {
    console.error('Summarization error:', error);
    // 出错时返回截断的原文
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  }
}

/**
 * 智能标签生成
 * @param {string} text - 原始文本
 * @param {Object} env - 环境变量
 * @returns {Array} 标签数组
 */
export async function generateTags(text, env) {
  const prompt = `请为以下文本生成相关的标签：

文本内容：
${text}

要求：
1. 生成5-10个相关标签
2. 标签应该涵盖：主题、领域、关键概念、情感色彩等
3. 使用简洁的词汇或短语
4. 优先使用中文标签，但对于专业术语可以使用英文
5. 按重要性排序

请按以下JSON格式返回：
{
  "tags": [
    {"name": "标签名", "category": "分类", "confidence": 0.9},
    {"name": "标签名", "category": "分类", "confidence": 0.8}
  ]
}

分类可以是：主题、技术、情感、行业、概念等`;
  
  try {
    const response = await callGeminiAPI(prompt, env);
    
    // 尝试解析JSON响应
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result.tags || [];
    }
    
    // 如果无法解析JSON，尝试从文本中提取标签
    const lines = response.split('\n').filter(line => line.trim());
    const tags = [];
    
    for (const line of lines) {
      const tagMatch = line.match(/["']([^"']+)["']/);
      if (tagMatch) {
        tags.push({
          name: tagMatch[1],
          category: '通用',
          confidence: 0.7
        });
      }
    }
    
    return tags.slice(0, 10); // 最多返回10个标签
    
  } catch (error) {
    console.error('Tag generation error:', error);
    // 出错时返回基础标签
    return [
      { name: '文本内容', category: '通用', confidence: 0.5 },
      { name: '待分类', category: '通用', confidence: 0.5 }
    ];
  }
}

/**
 * 批量AI处理
 * @param {Array} texts - 文本数组
 * @param {Object} env - 环境变量
 * @returns {Array} 处理结果数组
 */
export async function batchAIProcess(texts, env) {
  const results = [];
  
  // 为了避免API限制，串行处理
  for (const text of texts) {
    try {
      const [translation, summary, tags] = await Promise.all([
        translateAndNormalize(text, env),
        summarizeText(text, env),
        generateTags(text, env)
      ]);
      
      results.push({
        success: true,
        translation,
        summary,
        tags
      });
      
      // 添加延迟以避免API限制
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Batch AI processing error:', error);
      results.push({
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}