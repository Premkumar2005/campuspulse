const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// ── View Engine ───────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static Files ──────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Body Parser ───────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Session ───────────────────────────────────
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// ── Event Logger ──────────────────────────────
const eventLogger = require('./middleware/eventLogger');
app.use(eventLogger);

// ── Routes ────────────────────────────────────
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const dashboardRouter = require('./routes/dashboard');
const exportRouter = require('./routes/export');
const studentRouter = require('./routes/student');

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/export', exportRouter);
app.use('/student', studentRouter);

// ── Cron Job ──────────────────────────────────
const { startCron } = require('./cron/aggregator');
startCron();

// ── Error Handlers ────────────────────────────
const { notFound, globalError } = require('./middleware/errorHandler');
app.use(notFound);        // 404 — must be after all routes
app.use(globalError);     // 500 — must be last

// ── Start Server ──────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 CampusPulse running on http://localhost:${PORT}`);
});