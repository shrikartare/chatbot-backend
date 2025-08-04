const aemPageResponses = require('../shared/aemPageResponses');
const summarizeJSON = require('../utils/summarizeJSON');
const { pineconeIndex } = require('../services/pinecone');

function chunkJSON(jsonObj, chunkSize = 2000) {
  try {
    const text = summarizeJSON(jsonObj);
    // Split text into chunks of chunkSize characters
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  } catch (err) {
    console.error("❌ Error chunking JSON:", err.message);
    return [];
  }
}

async function embedText(text) {
  const openai = require('../services/openai');
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

async function upsertChunksToPinecone(chunks) {
  try {
    const embeddedChunks = [];
    for (const chunk of chunks) {
      const embedding = await embedText(chunk.text);
      if (!embedding) continue;
      embeddedChunks.push({
        id: chunk.id,
        values: embedding,
        metadata: { text: chunk.text },
      });
    }
    if (embeddedChunks.length > 0) {
      await pineconeIndex.namespace("chatbot-data").upsert(embeddedChunks);
      console.log(`✅ Upserted ${embeddedChunks.length} chunks to Pinecone`);
    } else {
      console.warn("⚠️ No valid embeddings generated to upsert.");
    }
  } catch (err) {
    console.error("❌ Error upserting to Pinecone:", err.message);
  }
}

async function initializePineconeData() {
  try {
    if (!aemPageResponses.length) {
      console.warn("⚠️ No data to ingest. Run /crawl first.");
      return;
    }
    for (const pageResponse of aemPageResponses.slice(0, 2)) {
      console.log("🔗 Processing:", pageResponse.aemUrl);
      const chunks = chunkJSON(pageResponse);
      if (!chunks.length) {
        console.warn(`⚠️ No chunks found for ${pageResponse.aemUrl}`);
        continue;
      }
      const chunkObjects = chunks.map((text, idx) => ({
        id: `${pageResponse?.aemUrl}-${idx}`,
        text,
      }));
      await upsertChunksToPinecone(chunkObjects);
    }
    console.log("✅ Ingestion completed.");
  } catch (error) {
    console.error("❌ Error during ingestion:", error.message);
  }
}

// Handles GET /ingest
exports.handleIngest = async (req, res) => {
  try {
    if (!aemPageResponses.length) {
      return res.status(400).json({ error: "No crawled data found. Run /crawl first." });
    }
    await initializePineconeData();
    res.status(200).json({ message: "Data ingestion done successfully" });
  } catch (error) {
    console.error("❌ /ingest route error:", error.message);
    res.status(500).json({ error: "Internal server error while ingesting" });
  }
};
