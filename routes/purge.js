const express = require('express');
const router = express.Router({ mergeParams: true });
const purgeController = require('../controllers/purgeController');

router.get('/', purgeController.handlePurge);

module.exports = router;
