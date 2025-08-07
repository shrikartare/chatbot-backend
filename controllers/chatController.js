const openai = require("../services/openai");
const { pineconeIndex } = require("../services/pinecone");
const { getPineConeNamespace } = require("../shared/getPineconeNamespace");

// You may want to move these helpers to a shared utils/services file if used by other controllers
async function embedText(text) {
  try {
    const res = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return res.data[0].embedding;
  } catch (err) {
    console.error("❌ Error generating embedding:", err.message);
    return null;
  }
}

async function queryPinecone(locale, query, topK = 20) {
  try {
    const queryEmbedding = await embedText(query);
    if (!queryEmbedding) return [];

    const namespace = getPineConeNamespace(locale);
    const queryResponse = await pineconeIndex.namespace(namespace).query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    return queryResponse.matches?.map((match) => match.metadata.text) || [];
  } catch (err) {
    console.error("❌ Error querying Pinecone:", err.message);
    return [];
  }
}

// Handles POST /chat
exports.handleChat = async (req, res) => {
  try {
    const locale = req.params["locale"];
    const { question, messages: previousMessages } = req.body;
    if (!question) {
      return res
        .status(400)
        .json({ error: "Missing 'question' in request body" });
    }

    const relevantChunks = await queryPinecone(locale, question);
    if (!relevantChunks.length) {
      return res
        .status(404)
        .json({ error: "No relevant context found for your question." });
    }

    const context = relevantChunks.join("\n\n");

    const messageList = [
      {
        role: "system",
        content: `You are a helpful chatbot that answers questions based on the JSON context data below. Use only the information from the context. Answer clearly.\n\nContext:\n${context}`,
      },
      ...(previousMessages || []),
      { role: "user", content: question },
    ];
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messageList,
      temperature: 0,
    });

    res.status(200).json({
      answer: response.choices[0].message.content,
      contextUsed: context,
    });
  } catch (err) {
    console.error("❌ /chat route error:", err.message);
    res
      .status(500)
      .json({ error: "Internal server error while generating answer" });
  }
};
