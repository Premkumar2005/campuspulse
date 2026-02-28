// ── 404 Handler ───────────────────────────────
exports.notFound = (req, res, next) => {
    res.status(404).render('404', {
        title: '404 - Page Not Found',
        url: req.originalUrl
    });
};

// ── Global Error Handler ──────────────────────
exports.globalError = (err, req, res, next) => {
    console.error('💥 Global Error:', err.message);
    console.error(err.stack);

    res.status(500).render('error', {
        title: 'Something went wrong',
        message: err.message || 'Internal server error'
    });
};