const db = require('../db/index');
const { Parser } = require('json2csv');

// ── GET Export Page ────────────────────────────
exports.getExportPage = (req, res) => {
    res.render('export', {
        user: req.session.user,
        title: 'Export Report',
        error: null,
        success: null
    });
};

// ── POST Export CSV ────────────────────────────
exports.exportCSV = async (req, res) => {
    const { start_date, end_date, export_type } = req.body;

    try {

        // Validate dates
        if (!start_date || !end_date) {
            return res.render('export', {
                user: req.session.user,
                title: 'Export Report',
                error: 'Please select both start and end date.',
                success: null
            });
        }

        if (new Date(start_date) > new Date(end_date)) {
            return res.render('export', {
                user: req.session.user,
                title: 'Export Report',
                error: 'Start date cannot be after end date.',
                success: null
            });
        }

        let data = [];
        let filename = '';
        let fields = [];

        // ── Export Type 1: Event Summary ────────────
        if (export_type === 'event_summary') {

            const [rows] = await db.query(
                `SELECT 
           date,
           event_type,
           total_count
         FROM event_summary
         WHERE date BETWEEN ? AND ?
         ORDER BY date DESC, total_count DESC`,
                [start_date, end_date]
            );

            data = rows;
            filename = `event_summary_${start_date}_to_${end_date}.csv`;
            fields = ['date', 'event_type', 'total_count'];
        }

        // ── Export Type 2: User Engagement ──────────
        else if (export_type === 'user_engagement') {

            const [rows] = await db.query(
                `SELECT
           u.name,
           u.email,
           u.role,
           ue.total_events,
           ue.last_active
         FROM user_engagement ue
         JOIN users u ON u.id = ue.user_id
         WHERE DATE(ue.last_active) BETWEEN ? AND ?
         ORDER BY ue.total_events DESC`,
                [start_date, end_date]
            );

            data = rows;
            filename = `user_engagement_${start_date}_to_${end_date}.csv`;
            fields = ['name', 'email', 'role', 'total_events', 'last_active'];
        }

        // ── Export Type 3: Raw Events ────────────────
        else if (export_type === 'raw_events') {

            const [rows] = await db.query(
                `SELECT
           r.id,
           u.name as user_name,
           u.email,
           r.event_type,
           r.route,
           r.timestamp,
           r.processed
         FROM raw_events r
         JOIN users u ON u.id = r.user_id
         WHERE DATE(r.timestamp) BETWEEN ? AND ?
         ORDER BY r.timestamp DESC`,
                [start_date, end_date]
            );

            data = rows;
            filename = `raw_events_${start_date}_to_${end_date}.csv`;
            fields = ['id', 'user_name', 'email', 'event_type', 'route', 'timestamp', 'processed'];
        }

        // No data found
        if (data.length === 0) {
            return res.render('export', {
                user: req.session.user,
                title: 'Export Report',
                error: 'No data found for the selected date range.',
                success: null
            });
        }

        // ── Convert to CSV ───────────────────────────
        const parser = new Parser({ fields });
        const csv = parser.parse(data);

        // ── Force browser download ───────────────────
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csv);

    } catch (err) {
        console.error('Export error:', err.message);
        res.render('export', {
            user: req.session.user,
            title: 'Export Report',
            error: 'Export failed. Please try again.',
            success: null
        });
    }
};