const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { isAuthenticated, isStudent } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, isStudent, studentController.getStudentPage);

module.exports = router;