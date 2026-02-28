const db = require('./db/index');

const eventTypes = [
    'page_view',
    'dashboard_view',
    'login',
    'logout',
    'form_submit',
    'csv_export',
    'student_view'
];

const routes = [
    '/dashboard',
    '/student',
    '/auth/login',
    '/auth/logout',
    '/export'
];

const seedEvents = async () => {
    console.log('🌱 Seeding 100 events over last 30 days...');

    // Get all user ids
    const [users] = await db.query('SELECT id FROM users');

    if (users.length === 0) {
        console.log('❌ No users found. Register users first.');
        process.exit();
    }

    let count = 0;

    for (let i = 0; i < 100; i++) {
        // Random user
        const user = users[Math.floor(Math.random() * users.length)];

        // Random event type
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

        // Random route
        const route = routes[Math.floor(Math.random() * routes.length)];

        // Random timestamp within last 30 days
        const randomMs = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
        const timestamp = new Date(Date.now() - randomMs);

        await db.query(
            `INSERT INTO raw_events (user_id, event_type, route, timestamp, processed)
       VALUES (?, ?, ?, ?, false)`,
            [user.id, eventType, route, timestamp]
        );

        count++;
    }

    console.log(`✅ Seeded ${count} events across last 30 days`);
    console.log('⏳ Wait 30 seconds for cron to process them...');
    process.exit();
};

seedEvents();