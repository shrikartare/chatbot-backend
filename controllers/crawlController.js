const aemPageResponses = require("../shared/aemPageResponses"); // You will need to create this shared state file
const { getPineConeNamespace } = require("../shared/getPineconeNamespace");
const getLocaleSlug = require("../shared/localeURLMapper");

async function getAEMData(locale, url) {
  let endpoint;
  if (url)
    endpoint = `https://www2.hm.com${url.replace(/html/g, "pageapi.v1.json")}`;
  else
    endpoint = `https://www2.hm.com/${locale}/${getLocaleSlug(
      locale
    )}.pageapi.v1.json`;

  console.log("🌐 Fetching:", endpoint);

  try {
    const response = await fetch(endpoint);
    const results = await response.json();

    aemPageResponses.push({
      pageUrl: endpoint,
      aemUrl: url || `/${locale}/${getLocaleSlug(locale)}`,
      ...results,
    });

    const content = results?.content || [];
    for (const item of content) {
      if (item?.type === "hm/components/customerservice/menulist/v1/menulist") {
        for (const link of item.links || []) {
          const alreadyCrawled = aemPageResponses.some(
            (p) => p.aemUrl === link.path
          );
          if (!alreadyCrawled) {
            await getAEMData(locale, link.path);
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
    aemPageResponses.length = 0;
    console.log("req.params", req.params["locale"]);
    const locale = req.params["locale"];
    console.log("req", JSON.stringify(req.params));
    console.log("locale", locale);
    await getAEMData(locale);

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
