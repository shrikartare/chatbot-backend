const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const config = require("./config");
const openai = require("./services/openai");
const { pinecone, pineconeIndex } = require("./services/pinecone");
const summarizeJSON = require("./utils/summarizeJSON");


const app = express();
app.use(cors());
app.use(bodyParser.json());

// openai and pineconeIndex are now imported from services
const aemPageResponses = require('./shared/aemPageResponses');



// Modularized routes
app.use('/chat', require('./routes/chat'));
app.use('/crawl', require('./routes/crawl'));
app.use('/ingest', require('./routes/ingest'));
app.use('/purge', require('./routes/purge'));

// Start server
app.listen(8000, () => {
  console.log("🚀 Server running at http://localhost:8000");
});
