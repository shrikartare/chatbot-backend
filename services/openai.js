const openAI = require("openai");
const config = require("../config");
const openai = new openAI.OpenAI({ apiKey: config.openaiApiKey });
module.exports = openai;
