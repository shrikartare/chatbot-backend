const aemPageResponses = require('../shared/aemPageResponses'); // You will need to create this shared state file

async function getAEMData(url) {
  const endpoint = `https://www2.hm.com${url.replace(/html/g, "pageapi.v1.json")}`;
  console.log("🌐 Fetching:", endpoint);

  try {
    const response = await fetch(endpoint);
    const results = await response.json();

    aemPageResponses.push({
      pageUrl: endpoint,
      aemUrl: url,
      ...results,
    });

    const content = results?.content || [];
    for (const item of content) {
      if (item?.type === "hm/components/customerservice/menulist/v1/menulist") {
        for (const link of item.links || []) {
          const alreadyCrawled = aemPageResponses.some((p) => p.aemUrl === link.path);
          if (!alreadyCrawled) {
            await getAEMData(link.path);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error fetching AEM data:", error.message);
  }
}

// Handles POST /crawl
exports.handleCrawl = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Missing 'url' in request body" });
    }

    await getAEMData(url);

    if (!aemPageResponses.length) {
      return res.status(404).json({ error: "No pages crawled from the URL" });
    }

    res.status(200).json({
      message: "Crawling completed successfully",
      aemPageResponses,
    });
  } catch (error) {
    console.error("❌ /crawl route error:", error.message);
    res.status(500).json({ error: "Internal server error while crawling" });
  }
};
