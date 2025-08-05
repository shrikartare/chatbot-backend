const express = require('express');
const router = express.Router({ mergeParams: true });
const ingestController = require('../controllers/ingestController');

router.get('/', ingestController.handleIngest);

module.exports = router;
