const cron = require('node-cron');
const db = require('../db/index');

// ─── Main Aggregation Function ───────────────────
const runAggregation = async () => {
    console.log('⚙️  [CRON] Aggregation started:', new Date().toLocaleTimeString());

    try {

        // ── STEP 1: Fetch unprocessed events ──────────
        const [unprocessedEvents] = await db.query(
            `SELECT * FROM raw_events WHERE processed = false`
        );

        if (unprocessedEvents.length === 0) {
            console.log('✅ [CRON] No new events to process.');
            return;
        }

        console.log(`📦 [CRON] Found ${unprocessedEvents.length} unprocessed events`);

        // ── STEP 2: Collect all event IDs ─────────────
        const eventIds = unprocessedEvents.map(e => e.id);

        // ── STEP 3: Aggregate by date + event_type ────
        const summaryMap = {};

        unprocessedEvents.forEach(event => {
            // Extract date only from timestamp
            const date = new Date(event.timestamp)
                .toISOString()
                .split('T')[0]; // "2024-01-15"

            const key = `${date}_${event.event_type}`;

            if (!summaryMap[key]) {
                summaryMap[key] = {
                    date: date,
                    event_type: event.event_type,
                    count: 0
                };
            }

            summaryMap[key].count++;
        });

        // ── STEP 4: Update event_summary table ────────
        for (const key of Object.keys(summaryMap)) {
            const { date, event_type, count } = summaryMap[key];

            await db.query(
                `INSERT INTO event_summary (date, event_type, total_count)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
         total_count = total_count + ?`,
                [date, event_type, count, count]
            );
        }

        console.log(`📊 [CRON] event_summary updated — ${Object.keys(summaryMap).length} rows`);

        // ── STEP 5: Aggregate by user_id ──────────────
        const engagementMap = {};

        unprocessedEvents.forEach(event => {
            if (!event.user_id) return; // skip null users

            if (!engagementMap[event.user_id]) {
                engagementMap[event.user_id] = {
                    user_id: event.user_id,
                    count: 0,
                    last_active: event.timestamp
                };
            }

            engagementMap[event.user_id].count++;

            // Track most recent timestamp
            if (new Date(event.timestamp) > new Date(engagementMap[event.user_id].last_active)) {
                engagementMap[event.user_id].last_active = event.timestamp;
            }
        });

        // ── STEP 6: Update user_engagement table ──────
        for (const userId of Object.keys(engagementMap)) {
            const { count, last_active } = engagementMap[userId];

            await db.query(
                `INSERT INTO user_engagement (user_id, total_events, last_active)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
         total_events = total_events + ?,
         last_active = ?`,
                [userId, count, last_active, count, last_active]
            );
        }

        console.log(`👤 [CRON] user_engagement updated — ${Object.keys(engagementMap).length} users`);

        // ── STEP 7: Mark all events as processed ──────
        await db.query(
            `UPDATE raw_events
       SET processed = true
       WHERE id IN (?)`,
            [eventIds]
        );

        console.log(`✅ [CRON] Marked ${eventIds.length} events as processed`);
        console.log('─'.repeat(50));

    } catch (err) {
        console.error('❌ [CRON] Aggregation failed:', err.message);
    }
};

// ─── Schedule Cron Job ───────────────────────────
// Runs every 30 seconds
const startCron = () => {
    cron.schedule('*/30 * * * * *', () => {
        runAggregation();
    });

    console.log('🕐 [CRON] Aggregator scheduled — runs every 30 seconds');
};

module.exports = { startCron, runAggregation };