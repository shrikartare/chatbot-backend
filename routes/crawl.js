const express = require('express');
const router = express.Router({ mergeParams: true });
const crawlController = require('../controllers/crawlController');

// Handles GET /:locale/crawl and POST /:locale/crawl/
router.get('/', crawlController.handleCrawl);

module.exports = router;
