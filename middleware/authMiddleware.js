// ─── Check if logged in ──────────────────────────
exports.isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next(); // logged in → continue
    } else {
        res.redirect('/auth/login'); // not logged in → send to login
    }
};

// ─── Check if Admin ──────────────────────────────
exports.isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next(); // is admin → continue
    } else {
        res.status(403).render('403', {
            message: 'Access denied. Admins only.'
        });
    }
};

// ─── Check if Student ────────────────────────────
exports.isStudent = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'student') {
        next();
    } else {
        res.redirect('/dashboard');
    }
};

// Request comes in
//       ↓
// isAuthenticated runs
//       ↓
// session exists ?  → YES → next() → go to route handler
//                  → NO  → redirect to login