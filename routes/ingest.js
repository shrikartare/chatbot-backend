const express = require('express');
const router = express.Router();
const ingestController = require('../controllers/ingestController');

router.get('/', ingestController.handleIngest);

module.exports = router;
