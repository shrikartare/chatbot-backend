const { pineconeIndex } = require("../services/pinecone");
const aemPageResponses = require("../shared/aemPageResponses");
const { getPineConeNamespace } = require("../shared/getPineconeNamespace");

// Handles GET /purge
exports.handlePurge = async (req, res) => {
  try {
    aemPageResponses.length = 0;
    const locale = req.params["locale"];
    await pineconeIndex.namespace(getPineConeNamespace(locale)).deleteAll();
    res
      .status(200)
      .json({ message: "All data purged from Pinecone successfully." });
  } catch (error) {
    console.error("❌ /purge route error:", error.message);
    res.status(500).json({ error: "Internal server error while purging data" });
  }
};
