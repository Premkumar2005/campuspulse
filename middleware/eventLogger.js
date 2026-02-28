const db = require('../db/index');

// ─── Detect event type from route ──────────────
const getEventType = (method, route) => {
    if (route.includes('/auth/login')) return 'login';
    if (route.includes('/auth/register')) return 'register';
    if (route.includes('/auth/logout')) return 'logout';
    if (route.includes('/dashboard')) return 'dashboard_view';
    if (route.includes('/student')) return 'student_view';
    if (route.includes('/export')) return 'csv_export';
    if (method === 'POST') return 'form_submit';
    return 'page_view'; // default
};

// ─── Routes to skip logging ─────────────────────
const skipRoutes = [
    '/favicon.ico',
    '/css',
    '/js',
    '/images',
    '/public'
];

// ─── Main Middleware Function ────────────────────
const eventLogger = async (req, res, next) => {

    try {
        // Skip static files and assets
        const shouldSkip = skipRoutes.some(skip =>
            req.path.startsWith(skip)
        );

        if (shouldSkip) {
            return next();
        }

        // Only log if user is logged in
        if (req.session && req.session.user) {
            const userId = req.session.user.id;
            const route = req.path;
            const method = req.method;
            const eventType = getEventType(method, route);

            // Insert into raw_events
            await db.query(
                `INSERT INTO raw_events 
         (user_id, event_type, route, timestamp, processed) 
         VALUES (?, ?, ?, NOW(), false)`,
                [userId, eventType, route]
            );
        }

    } catch (err) {
        // Don't crash app if logging fails
        console.error('Event logger error:', err.message);
    }

    next(); // always continue
};

module.exports = eventLogger;