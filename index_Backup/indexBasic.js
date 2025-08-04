const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const openAI = require('openai')
const dotenv = require('dotenv')
const path = require("path");


dotenv.config()
const openai = new openAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

app.use(cors());
app.use(bodyParser.json());


async function embedText(text) {
  const res = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return res.data[0].embedding;
}

function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (magA * magB);
}

function chunkJSON(jsonObj, chunkSize = 300) {
  const text = JSON.stringify(jsonObj, null, 2);
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  return chunks;
}

const jsonFiles = ["customer-service.json", "contact.json"];
let embeddedChunks = [];

async function initializeEmbeddings() {
  for (const file of jsonFiles) {
    const filePath = path.join(__dirname, "./data", file);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const chunks = chunkJSON(content);

    for (const chunk of chunks) {
      const embedding = await embedText(chunk);
      embeddedChunks.push({ chunk, embedding });
    }
  }
  console.log("Embeddings initialized");
}

async function retrieveRelevantChunks(query, topK = 3) {
  const queryEmbedding = await embedText(query);

  const scored = embeddedChunks.map(({ chunk, embedding }) => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, embedding),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.chunk);
}

app.use("/chat", async (req, res) => {
  try {
    const { question } = req.body;
    const relevantChunks = await retrieveRelevantChunks(question);
    
    const context = relevantChunks.join("\n\n");

    const prompt = `
  You are a helpful chatbot that answers questions based on JSON context data in embedded vector format below.
  Answer clearly and concisely in natural language, using only the information provided.

Context:
${context}

Question: ${question}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });
 
    res.json({ answer: response.choices[0].message.content,
        response: response
     });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

initializeEmbeddings().then(() => {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
});
