const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const userModel       = require('./models/user');
const experienceModel = require('./models/Experience');

// ✅ Route files
const experienceRoutes = require('./routes/experienceRoutes');
const hostRoutes       = require('./routes/hostRoutes');
const adminRoutes      = require('./routes/adminRoutes');


// ================== DATABASE CONNECTION ==================
mongoose.connect("mongodb://127.0.0.1:27017/tripadvisor")
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));


// ================== MIDDLEWARE ==================
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride("_method"));

app.use(session({
    secret: 'tripadvisor_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(flash());

// ✅ Global locals — available in every EJS view automatically
app.use((req, res, next) => {
    res.locals.currentUser = req.session.userId   || null;
    res.locals.userRole    = req.session.userRole || null;
    res.locals.success     = req.flash('success');
    res.locals.error       = req.flash('error');
    next();
});


// ================== AUTH MIDDLEWARE ==================
function isLoggedIn(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
}


// ================== ROUTES ==================

// Root → redirect based on session
app.get('/', function (req, res) {
    if (req.session && req.session.userId) {
        return res.redirect('/home');
    }
    res.redirect('/login');
});

// Home Page (protected)
// FIX 1: Pass currentUser and userRole explicitly so navbar.ejs works correctly
app.get('/home', isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findById(req.session.userId);
        const featuredExperiences = await experienceModel
            .find({ status: 'approved' })
            .sort({ createdAt: -1 })
            .limit(3);

        res.render("home", {
            user,
            featuredExperiences,
            currentUser: req.session.userId,      // ✅ for navbar
            userRole:    req.session.userRole      // ✅ for navbar host/admin links
        });
    } catch (err) {
        console.error(err);
        res.redirect('/login');
    }
});

// Login Page — GET
app.get('/login', function (req, res) {
    if (req.session && req.session.userId) {
        return res.redirect('/home');
    }
    res.render("login", { error: null, activeTab: 'login' });
});

// Register Page — GET
app.get('/register', function (req, res) {
    if (req.session && req.session.userId) {
        return res.redirect('/home');
    }
    res.render("login", { error: null, activeTab: 'signup' });
});


// ================== REGISTER — POST ==================
app.post('/register', async function (req, res) {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            return res.render("login", {
                error: "All fields are required.",
                activeTab: 'signup'
            });
        }

        if (password !== confirmPassword) {
            return res.render("login", {
                error: "Passwords do not match.",
                activeTab: 'signup'
            });
        }

        if (password.length < 8) {
            return res.render("login", {
                error: "Password must be at least 8 characters.",
                activeTab: 'signup'
            });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.render("login", {
                error: "An account with this email already exists.",
                activeTab: 'signup'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({
            name,
            email,
            password: hashedPassword
            // role defaults to 'traveler' as defined in updated User model
        });

        // Auto-login after registration
        req.session.userId   = newUser._id;
        req.session.userRole = newUser.role; // ✅ save role in session
        res.redirect('/home');

    } catch (err) {
        console.error(err);
        res.render("login", {
            error: "Something went wrong. Please try again.",
            activeTab: 'signup'
        });
    }
});


// ================== LOGIN — POST ==================
app.post('/login', async function (req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.render("login", {
                error: "Email and password are required.",
                activeTab: 'login'
            });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.render("login", {
                error: "No account found with that email.",
                activeTab: 'login'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render("login", {
                error: "Incorrect password. Please try again.",
                activeTab: 'login'
            });
        }

        // ✅ Save both userId AND role in session
        req.session.userId   = user._id;
        req.session.userRole = user.role;
        res.redirect('/home');

    } catch (err) {
        console.error(err);
        res.render("login", {
            error: "Something went wrong. Please try again.",
            activeTab: 'login'
        });
    }
});


// ================== PROFILE ==================
// FIX 2: Pass currentUser + userRole so navbar works on profile page
app.get('/profile', isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findById(req.session.userId);
        res.render("profile", {
            user,
            currentUser: req.session.userId,
            userRole:    req.session.userRole
        });
    } catch (err) {
        console.error(err);
        res.redirect('/home');
    }
});

// FIX 3: Pass currentUser + userRole so navbar works on explore page
app.get('/explore', isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findById(req.session.userId);
        res.render("explore", {
            user,
            currentUser: req.session.userId,
            userRole:    req.session.userRole
        });
    } catch (err) {
        console.error(err);
        res.redirect('/home');
    }
});


// ================== LOGOUT ==================
app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        if (err) console.error(err);
        res.redirect('/login');
    });
});


// ================== CRUD ROUTES (protected) ==================
app.get('/read', isLoggedIn, async function (req, res) {
    let allusers = await userModel.find();
    res.render("read", { users: allusers });
});

app.get('/delete/:id', isLoggedIn, async function (req, res) {
    await userModel.findOneAndDelete({ _id: req.params.id });
    res.redirect("/read");
});

app.get('/edit/:id', isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ _id: req.params.id });
    res.render("edit", { user });
});

app.post('/update/:id', isLoggedIn, async function (req, res) {
    let { image, name, email } = req.body;
    await userModel.findOneAndUpdate(
        { _id: req.params.id },
        { email, image, name },
        { new: true }
    );
    res.redirect('/read');
});

app.post('/create', isLoggedIn, async function (req, res) {
    let { name, email, image } = req.body;
    await userModel.create({ name, email, image });
    res.redirect("/read");
});


// ================== PLACE PAGES ==================
// FIX 3 (continued): All place pages also need currentUser + userRole for navbar

app.get('/varanasi', isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findById(req.session.userId);
        res.render("varanasi", {
            user,
            currentUser: req.session.userId,
            userRole:    req.session.userRole
        });
    } catch (err) {
        res.redirect('/home');
    }
});

app.get('/jaisalmer', isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findById(req.session.userId);
        res.render("jaisalmer", {
            user,
            currentUser: req.session.userId,
            userRole:    req.session.userRole
        });
    } catch (err) {
        res.redirect('/home');
    }
});

// FIX 4: Your route was '/kedarkantha' but your EJS file is 'kedarkanth.ejs'
// Keeping route as kedarkantha (with 'a') — just make sure your EJS filename matches
app.get('/kedarkantha', isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findById(req.session.userId);
        res.render("kedarkanth", {      // ← matches your actual filename kedarkanth.ejs
            user,
            currentUser: req.session.userId,
            userRole:    req.session.userRole
        });
    } catch (err) {
        res.redirect('/home');
    }
});


// ================== EXPERIENCE / HOST / ADMIN ROUTES ==================
// ✅ These come AFTER all session + flash + locals middleware above
app.use('/experiences',       experienceRoutes);
app.use('/host',              hostRoutes);
app.use('/admin/experiences', adminRoutes);

// ⚠️ TEMPORARY — delete after use
app.get('/make-admin-temp', isLoggedIn, async function(req, res) {
    await userModel.findByIdAndUpdate(req.session.userId, { role: 'admin' });
    req.session.userRole = 'admin';
    res.send('You are now admin! <a href="/admin/experiences">Go to admin panel</a>');
});

// ============================================================
// ADD THESE DEBUG ROUTES TO app.js TEMPORARILY
// Visit each URL and check what you see
// DELETE them after fixing
// ============================================================


// ── DEBUG 1: Check session ────────────────────────────────────
// Visit: http://localhost:3000/debug/session
// Should show your userId, userRole etc.
app.get('/debug/session', (req, res) => {
    res.json({
        session:     req.session,
        userId:      req.session.userId   || 'NOT SET ❌',
        userRole:    req.session.userRole || 'NOT SET ❌',
        isLoggedIn:  !!req.session.userId,
    });
});


// ── DEBUG 2: Check if Experience model works ─────────────────
// Visit: http://localhost:3000/debug/experiences
// Shows ALL experiences in DB regardless of status
app.get('/debug/experiences', async (req, res) => {
    try {
        const all = await experienceModel.find({});
        res.json({
            totalInDB:   all.length,
            experiences: all.map(e => ({
                id:       e._id,
                title:    e.title,
                status:   e.status,
                hostId:   e.hostId,
                hostName: e.hostName,
                city:     e.city,
                createdAt: e.createdAt,
            }))
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});


// ── DEBUG 3: Check host status of logged-in user ─────────────
// Visit: http://localhost:3000/debug/me
// Shows your full user record from DB
app.get('/debug/me', async (req, res) => {
    if (!req.session.userId) {
        return res.json({ error: 'Not logged in ❌ — go to /login first' });
    }
    try {
        const user = await userModel.findById(req.session.userId);
        res.json({
            id:                   user._id,
            name:                 user.name || user.username,
            email:                user.email,
            role:                 user.role,
            hostApplicationStatus: user.hostApplicationStatus,
            isHostVerified:       user.isHostVerified,
            sessionRole:          req.session.userRole,
            // ── Problem checker ──
            checks: {
                roleIsHost:     user.role === 'host',
                roleIsAdmin:    user.role === 'admin',
                sessionMatches: user.role === req.session.userRole,
                canAccessHost:  user.role === 'host' || user.role === 'admin',
            }
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});


// ── DEBUG 4: Manually create a test experience ────────────────
// Visit: http://localhost:3000/debug/create-test-experience
// Creates a real experience in DB directly, bypassing the form
// This tells us if the model itself works
app.get('/debug/create-test-experience', async (req, res) => {
    if (!req.session.userId) {
        return res.json({ error: 'Not logged in ❌' });
    }
    try {
        const user = await userModel.findById(req.session.userId);
        const exp  = await experienceModel.create({
            title:       'DEBUG TEST Experience',
            slug:        'debug-test-experience-' + Date.now(),
            description: 'This is a debug test',
            category:    'Workshop',
            placeName:   'Test Place',
            city:        'Varanasi',
            state:       'Uttar Pradesh',
            country:     'India',
            hostId:      user._id,
            hostName:    user.name || user.username || 'Test Host',
            isFree:      true,
            price:       0,
            status:      'pending',
        });
        res.json({
            message:    '✅ Test experience CREATED successfully!',
            id:         exp._id,
            title:      exp.title,
            status:     exp.status,
            // Now visit /debug/experiences to see it
            next:       'Visit /debug/experiences to confirm it saved',
        });
    } catch (err) {
        res.json({
            message: '❌ Experience creation FAILED',
            error:   err.message,
            // This will tell you exactly which field is wrong
        });
    }
});

// ================== SERVER ==================
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});