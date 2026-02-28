const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Export page
router.get('/', isAuthenticated, isAdmin, exportController.getExportPage);

// Download CSV
router.post('/download', isAuthenticated, isAdmin, exportController.exportCSV);

module.exports = router;