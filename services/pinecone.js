const { Pinecone } = require("@pinecone-database/pinecone");
const config = require("../config");
const pinecone = new Pinecone({ apiKey: config.pineconeApiKey });
const pineconeIndex = pinecone.Index(config.pineconeIndexName);
module.exports = { pinecone, pineconeIndex };
