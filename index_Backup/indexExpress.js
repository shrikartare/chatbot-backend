const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/chat", async (req, res) => {

   const { messages } = req.body;
  console.log('messages, req.body:', messages, req.body);
  const json1 = fs.readFileSync("./data/customer-service.json", "utf-8");
  const json2 = fs.readFileSync("./data/contact.json", "utf-8");
  // Build the prompt by injecting JSONs + user query
  const prompt = `
  You are a helpful chatbot that answers questions based on JSON data below.
  Answer clearly and concisely in natural language, using only the information provided.

  JSON 1:
  ${json1}

  JSON 2:
  ${json2}

  User question:
  ${messages}
    `;
  // Call GPT API
  const response = await openai.chat.completions.create({
    model: "gpt-4", // or 'gpt-3.5-turbo'
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });
  // Return GPT's natural language answer
  return res.json(response.choices[0].message.content);
});
app.listen(3000,() => {
  console.log(`Server running at http://localhost:3000`);
});
// const userQuery =
//   "Search for component type having value hm/components/general/heading display page name and occurrences.";

// askChatbot(userQuery)
//   .then((answer) => {
//     console.log("GPT says:\n", answer);
//   })
//   .catch(console.error);
