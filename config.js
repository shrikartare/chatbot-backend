require('dotenv').config();

module.exports = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  pineconeApiKey: process.env.PINECONE_API_KEY,
  pineconeIndexName: 'pageapi-index',
};
