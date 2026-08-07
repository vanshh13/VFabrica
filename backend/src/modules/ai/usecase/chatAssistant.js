'use strict';

const { logger } = require('../../../utils/logger');

module.exports = function makeChatAssistant({ sequelize, getCatalogForAI, getProductsByIds }) {
  return async function chatAssistant({ message, history = [] }) {
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new Error('Message string is required');
    }

    // 1. Fetch live catalog for context
    const catalog = await getCatalogForAI(sequelize, 40);

    const catalogSummary = catalog.map((p, idx) => 
      `${idx + 1}. [ID: ${p.id}] "${p.name}" | Category: ${p.category_name || 'N/A'} | Fabric Type: ${p.fabric_type_name || 'N/A'} | Price: ₹${p.base_price}/${p.unit_symbol || 'm'} | MOQ: ${p.minimum_order_quantity} | Lead Time: ${p.lead_time_days} days | Supplier: ${p.supplier_name || 'VF Textiles'}\n   Description: ${p.description || 'Premium fabric'}`
    ).join('\n');

    const systemPrompt = `You are VFabrica AI, an expert B2B Fabric Shopping & Sourcing Assistant for the VFabrica B2B Marketplace.

Your goals:
1. Help wholesale buyers, designers, and manufacturers find the best fabrics, textiles, poplins, silks, cottons, and linens.
2. Recommend relevant products strictly from the VFabrica catalog provided below.
3. Answer technical questions about GSM, weave types, fabric compositions, minimum order quantities (MOQ), drape, and care instructions.
4. Calculate estimated costs in Indian Rupees (₹) based on buyer quantity and MOQ.
5. Be polite, professional, direct, and enthusiastic.

CURRENT VFABRICA CATALOG:
${catalogSummary || 'No products currently listed.'}

CRITICAL INSTRUCTIONS FOR PRODUCT RECOMMENDATIONS:
Whenever you recommend specific products from the catalog, you MUST include a special JSON block at the very end of your response formatted exactly as follows:
RECOMMENDED_IDS: ["product_id_1", "product_id_2"]

Example response format:
"Based on your request for breathable summer fabrics, I highly recommend our Organic Cotton Poplin. It features smooth weave and light drape...

RECOMMENDED_IDS: ["b710ce18-d9c9-40f3-bf2a-22ed9b1aff65"]"

Keep your textual responses clear and markdown-formatted.`;

    // 2. Prepare conversation messages
    const formattedHistory = Array.isArray(history) 
      ? history.slice(-6).map(h => ({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: String(h.content)
        }))
      : [];

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message }
    ];

    const apiKey = process.env.LLM_API_KEY;
    const baseUrl = process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1';
    const model = process.env.MODEL_NAME || 'llama-3.3-70b-versatile';

    if (!apiKey) {
      logger.warn('LLM_API_KEY environment variable is not configured. Falling back to catalog search matching.');
      throw new Error('LLM_API_KEY is not configured');
    }

    try {
      const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ status: response.status, errorText }, 'Groq LLM API returned non-200 status');
        throw new Error(`LLM API request failed with status ${response.status}`);
      }

      const responseData = await response.json();
      let rawReply = responseData?.choices?.[0]?.message?.content || "I couldn't generate a response at this time. Please try again.";

      // 3. Extract RECOMMENDED_IDS
      const recommendedIds = [];
      const idMatch = rawReply.match(/RECOMMENDED_IDS:\s*(\[[^\]]*\])/);
      if (idMatch && idMatch[1]) {
        try {
          const parsedIds = JSON.parse(idMatch[1]);
          if (Array.isArray(parsedIds)) {
            recommendedIds.push(...parsedIds);
          }
        } catch (e) {
          logger.warn('Failed to parse RECOMMENDED_IDS from LLM response');
        }
      }

      // Also clean up the RECOMMENDED_IDS tag from the visible text reply
      const cleanReply = rawReply.replace(/RECOMMENDED_IDS:\s*\[[^\]]*\]/g, '').trim();

      // 4. Fetch rich product details for recommended IDs
      let recommendedProducts = [];
      if (recommendedIds.length > 0) {
        recommendedProducts = await getProductsByIds(sequelize, recommendedIds);
      } else {
        // Fallback: search catalog for keyword matches if user asked for specific items
        const lowerMessage = message.toLowerCase();
        const matched = catalog.filter(p => 
          lowerMessage.includes(p.name.toLowerCase()) || 
          (p.fabric_type_name && lowerMessage.includes(p.fabric_type_name.toLowerCase())) ||
          (p.category_name && lowerMessage.includes(p.category_name.toLowerCase()))
        ).slice(0, 2);
        recommendedProducts = matched;
      }

      return {
        reply: cleanReply,
        recommendedProducts
      };
    } catch (error) {
      logger.error({ error: error.message }, 'AI chat assistant execution error');
      
      // Smart offline fallback response if API key fails or network issue occurs
      const lowerMessage = message.toLowerCase();
      const matched = catalog.filter(p => 
        lowerMessage.includes(p.name.toLowerCase()) || 
        (p.fabric_type_name && lowerMessage.includes(p.fabric_type_name.toLowerCase())) ||
        (p.category_name && lowerMessage.includes(p.category_name.toLowerCase()))
      ).slice(0, 3);

      return {
        reply: "I am VFabrica AI, your B2B Fabric Assistant! I can help you discover premium woven and knitted fabrics, analyze wholesale pricing, and check order minimums. Here are top recommended products matching your inquiry from our catalog:",
        recommendedProducts: matched.length > 0 ? matched : catalog.slice(0, 2)
      };
    }
  };
};
