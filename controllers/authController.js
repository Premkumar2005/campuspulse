const db = require('../db/index');
const bcrypt = require('bcrypt');

// ─── GET Register Page ───────────────────────────
exports.getRegister = (req, res) => {
    res.render('auth/register', { error: null });
};

// ─── POST Register ───────────────────────────────
exports.postRegister = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Check if email already exists
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ?', [email]
        );

        if (existing.length > 0) {
            return res.render('auth/register', {
                error: 'Email already registered. Please login.'
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role || 'student']
        );

        // Redirect to login
        res.redirect('/auth/login');

    } catch (err) {
        console.error('Register error:', err.message);
        res.render('auth/register', { error: 'Something went wrong. Try again.' });
    }
};

// ─── GET Login Page ──────────────────────────────
exports.getLogin = (req, res) => {
    res.render('auth/login', { error: null });
};

// ─── POST Login ──────────────────────────────────
exports.postLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?', [email]
        );

        if (rows.length === 0) {
            return res.render('auth/login', {
                error: 'No account found with this email.'
            });
        }

        const user = rows[0];

        // Compare password with hash
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.render('auth/login', {
                error: 'Incorrect password. Try again.'
            });
        }

        // Save user info in session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // Redirect based on role
        if (user.role === 'admin') {
            res.redirect('/dashboard');
        } else {
            res.redirect('/student');
        }

    } catch (err) {
        console.error('Login error:', err.message);
        res.render('auth/login', { error: 'Something went wrong. Try again.' });
    }
};

// ─── Logout ──────────────────────────────────────
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.redirect('/auth/login');
    });
};

exports.postRegister = async (req, res) => {
    const { name, email, password, role } = req.body;

    // ── Input Validation ──────────────────────────
    if (!name || !email || !password) {
        return res.render('auth/register', {
            error: 'All fields are required.'
        });
    }

    if (name.trim().length < 2) {
        return res.render('auth/register', {
            error: 'Name must be at least 2 characters.'
        });
    }

    if (password.length < 6) {
        return res.render('auth/register', {
            error: 'Password must be at least 6 characters.'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.render('auth/register', {
            error: 'Please enter a valid email address.'
        });
    }

    try {
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ?', [email]
        );

        if (existing.length > 0) {
            return res.render('auth/register', {
                error: 'Email already registered. Please login.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name.trim(), email.toLowerCase(), hashedPassword, role || 'student']
        );

        res.redirect('/auth/login');

    } catch (err) {
        console.error('Register error:', err.message);
        res.render('auth/register', {
            error: 'Something went wrong. Try again.'
        });
    }
};