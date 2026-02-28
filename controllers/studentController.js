const db = require('../db/index');

exports.getStudentPage = async (req, res) => {
    const userId = req.session.user.id;

    try {

        // ── 1. My Profile Info ─────────────────────
        const [[profile]] = await db.query(
            `SELECT name, email, role, created_at
       FROM users WHERE id = ?`,
            [userId]
        );

        // ── 2. My Activity Stats ───────────────────
        const [[stats]] = await db.query(
            `SELECT 
         COALESCE(total_events, 0) as total_events,
         last_active
       FROM user_engagement
       WHERE user_id = ?`,
            [userId]
        );

        // ── 3. My Events Today ─────────────────────
        const [[{ todayCount }]] = await db.query(
            `SELECT COUNT(*) as todayCount
       FROM raw_events
       WHERE user_id = ? AND DATE(timestamp) = CURDATE()`,
            [userId]
        );

        // ── 4. My Events This Week ─────────────────
        const [[{ weekCount }]] = await db.query(
            `SELECT COUNT(*) as weekCount
       FROM raw_events
       WHERE user_id = ?
       AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [userId]
        );

        // ── 5. My Most Used Feature ────────────────
        const [[topFeature]] = await db.query(
            `SELECT event_type, COUNT(*) as cnt
       FROM raw_events
       WHERE user_id = ?
       GROUP BY event_type
       ORDER BY cnt DESC
       LIMIT 1`,
            [userId]
        );

        // ── 6. Leaderboard Top 10 Students ────────
        const [leaderboard] = await db.query(
            `SELECT 
         u.name,
         ue.total_events,
         ue.last_active,
         RANK() OVER (ORDER BY ue.total_events DESC) as rank_pos
       FROM user_engagement ue
       JOIN users u ON u.id = ue.user_id
       WHERE u.role = 'student'
       ORDER BY ue.total_events DESC
       LIMIT 10`
        );

        // ── 7. My Rank ─────────────────────────────
        const [[myRank]] = await db.query(
            `SELECT rank_pos FROM (
         SELECT user_id,
           RANK() OVER (ORDER BY total_events DESC) as rank_pos
         FROM user_engagement
       ) ranked
       WHERE user_id = ?`,
            [userId]
        );

        res.render('student', {
            title: 'My Dashboard',
            user: req.session.user,
            profile,
            stats: stats || { total_events: 0, last_active: null },
            todayCount,
            weekCount,
            topFeature: topFeature || { event_type: 'none', cnt: 0 },
            leaderboard,
            myRank: myRank || { rank_pos: '-' }
        });

    } catch (err) {
        console.error('Student page error:', err.message);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load your dashboard.'
        });
    }
};