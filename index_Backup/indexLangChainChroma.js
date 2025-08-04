// Updated version of your chatbot using LangChain + ChromaDB

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Document } from '@langchain/core/documents';
import { ChatOpenAI } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 3000;
let retriever;

async function loadDataToChroma() {
  const jsonFiles = ['customer-service.json', 'contact.json'];
  const allDocs = [];

  for (const file of jsonFiles) {
    const filePath = path.join('./data', file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const jsonContent = JSON.stringify(JSON.parse(content), null, 2);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const splitDocs = await splitter.createDocuments([jsonContent]);

    allDocs.push(...splitDocs);
  }

  const vectorStore = await Chroma.fromDocuments(
    allDocs,
    new OpenAIEmbeddings(),
    {
      collectionName: 'chatbot-data',
      persistDirectory: './chroma',
    }
  );

  await vectorStore.persist();
  return vectorStore.asRetriever();
}

app.post('/chat', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'No question provided' });

    const model = new ChatOpenAI({ modelName: 'gpt-4', temperature: 0 });
    const chain = RetrievalQAChain.fromLLM(model, retriever);

    const response = await chain.call({ query: question });
    res.json({ answer: response.text });
  } catch (err) {
    console.error('Error in /chat:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

loadDataToChroma().then((r) => {
  retriever = r;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});
