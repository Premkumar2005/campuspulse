const db = require('../db/index');

exports.getDashboard = async (req, res) => {
    try {

        // ── 1. Total users ─────────────────────────
        const [[{ totalUsers }]] = await db.query(
            `SELECT COUNT(*) as totalUsers FROM users`
        );

        // ── 2. Daily active users (today) ──────────
        const [[{ dailyActive }]] = await db.query(
            `SELECT COUNT(DISTINCT user_id) as dailyActive
       FROM raw_events
       WHERE DATE(timestamp) = CURDATE()`
        );

        // ── 3. Total events today ──────────────────
        const [[{ todayEvents }]] = await db.query(
            `SELECT COUNT(*) as todayEvents
       FROM raw_events
       WHERE DATE(timestamp) = CURDATE()`
        );

        // ── 4. Total events all time ───────────────
        const [[{ totalEvents }]] = await db.query(
            `SELECT SUM(total_count) as totalEvents
       FROM event_summary`
        );

        // ── 5. Event type distribution (pie chart) ─
        const [eventDistribution] = await db.query(
            `SELECT event_type, SUM(total_count) as total
       FROM event_summary
       GROUP BY event_type
       ORDER BY total DESC`
        );

        // ── 6. Daily activity last 7 days (bar chart)
        const [dailyActivity] = await db.query(
            `SELECT date, SUM(total_count) as total
       FROM event_summary
       WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY date
       ORDER BY date ASC`
        );

        // ── 7. Top 10 active users ─────────────────
        const [topUsers] = await db.query(
            `SELECT u.name, u.email, u.role,
              ue.total_events, ue.last_active
       FROM user_engagement ue
       JOIN users u ON u.id = ue.user_id
       ORDER BY ue.total_events DESC
       LIMIT 10`
        );

        // ── 8. Recent raw events ───────────────────
        const [recentEvents] = await db.query(
            `SELECT r.event_type, r.route, r.timestamp,
              u.name as user_name
       FROM raw_events r
       JOIN users u ON u.id = r.user_id
       ORDER BY r.timestamp DESC
       LIMIT 10`
        );

        // ── Render dashboard with all data ─────────
        res.render('dashboard', {
            user: req.session.user,
            title: 'Admin Dashboard',
            totalUsers,
            dailyActive,
            todayEvents,
            totalEvents: totalEvents || 0,
            eventDistribution,
            dailyActivity,
            topUsers,
            recentEvents
        });

    } catch (err) {
        console.error('Dashboard error:', err.message);
        res.status(500).send('Dashboard failed to load');
    }
};