const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin, isStudent } = require('../middleware/authMiddleware');

// Home
router.get('/', (req, res) => {
    res.render('index', { title: 'CampusPulse' });
});

// Admin Dashboard (protected)
// router.get('/dashboard', isAuthenticated, isAdmin, (req, res) => {
//     res.render('dashboard', {
//         user: req.session.user,
//         title: 'Admin Dashboard'
//     });
// });

// Student Page (protected)
// router.get('/student', isAuthenticated, isStudent, (req, res) => {
//     res.render('student', {
//         user: req.session.user,
//         title: 'Student Home'
//     });
// });

module.exports = router;