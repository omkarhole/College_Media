const OpenAI = require('openai');
const logger = require('../utils/logger');

class EmbeddingService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        if (this.apiKey) {
            this.openai = new OpenAI({ apiKey: this.apiKey });
        } else {
            logger.warn('OPENAI_API_KEY missing. Semantic Search will be disabled/mocked.');
        }
        this.model = 'text-embedding-3-small';
    }

    /**
     * Generate vector embedding for a given text
     * @param {string} text 
     * @returns {Promise<number[]>} 1536-dimensional vector
     */
    async generateEmbedding(text) {
        if (!this.openai) {
            // Mock vector for local dev without API Key
            return new Array(1536).fill(0).map(() => Math.random());
        }

        if (!text) return null;

        try {
            const response = await this.openai.embeddings.create({
                model: this.model,
                input: text.replace(/\n/g, ' '),
                encoding_format: 'float'
            });
            return response.data[0].embedding;

        } catch (error) {
            logger.error('Embedding Generation Error:', error.message);
            return null;
        }
    }
}

module.exports = new EmbeddingService();
