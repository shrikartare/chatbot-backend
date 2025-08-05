const express = require('express');
const router = express.Router({ mergeParams: true });
const chatController = require('../controllers/chatController');

router.post('/', chatController.handleChat);

module.exports = router;
