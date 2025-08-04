const express = require('express');
const router = express.Router();
const purgeController = require('../controllers/purgeController');

router.get('/', purgeController.handlePurge);

module.exports = router;
