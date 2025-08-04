// backend-pinecone-chat.js

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { RetrievalQAChain } from "langchain/chains";

dotenv.config();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let retriever;

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  // environment: "us-east-1"
});
//   import { Pinecone } from '@pinecone-database/pinecone';

// const pc = new Pinecone({
//   apiKey: '********-****-****-****-************'
// });
// const index = pc.index('quickstart');

const pineconeIndex = pinecone.Index("pageapi-index");

// 🧠 Load and embed documents to Pinecone
async function loadDataToPinecone() {
  const jsonFiles = ["customer-service.json", "contact.json"];
  const allDocs = [];
  console.log("jsonfile");
  for (const file of jsonFiles) {
    const filePath = path.join(__dirname, "data", file);
    const content = await fs.readFile(filePath, "utf-8");
    const text = JSON.stringify(
      {
        page_url: file,
        data: JSON.parse(content),
      },
      null,
      2
    );

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    const splitDocs = await splitter.createDocuments([text]);
    console.log("splitDocs", splitDocs);
    allDocs.push(...splitDocs);
  }
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  console.log("Connectin to pinecone");
  let vectorStore;
  try {
    vectorStore = await PineconeStore.fromDocuments(allDocs, embeddings, {
      pineconeIndex,
      namespace: "chatbot-data",
    });
    console.log("data inserted to pinecone");
  } catch (error) {
    console.log("error", error);
  }

  return vectorStore.asRetriever({ k: 3 });
}

// 🔁 Endpoint
app.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question)
      return res.status(400).json({ error: "No question provided" });

    const model = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const chain = await RetrievalQAChain.fromLLM(model, retriever);

    const response = await chain.call({ query: question });

    res.json({ answer: response.text });
  } catch (err) {
    console.error("❌ Error in /chat:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🔃 Initialize
// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });
// await pineconeIndex.namespace("chatbot-data").deleteAll();
loadDataToPinecone().then((r) => {
  console.log('loaded Data to pinecone')
  retriever = r;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}).catch(error=>console.log('error',error))
