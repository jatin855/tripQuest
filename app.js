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
const marketplaceRoutes     = require('./routes/marketplaceRoutes');
const marketplaceAdminRoutes = require('./routes/marketplaceAdminRoutes');


// ================== DATABASE CONNECTION ==================
mongoose.connect("mongodb://127.0.0.1:27017/TripQuest")
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));


// ================== MIDDLEWARE ==================
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));  // serves public/data/*.json at /data/*.json
app.use(methodOverride("_method"));

app.use(session({
    secret: 'TripQuest_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(flash());

// ✅ Global locals — available in every EJS view automatically
app.use((req, res, next) => {
    res.locals.currentUser      = req.session.userId          || null;
    res.locals.userRole         = req.session.userRole        || null;
    res.locals.shopOwnerStatus  = req.session.shopOwnerStatus || null;
    res.locals.success          = req.flash('success');
    res.locals.error            = req.flash('error');
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
app.get('/home', isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findById(req.session.userId);
        const featuredExperiences = await experienceModel
            .find({ status: 'approved' })
            .sort({ createdAt: -1 })
            .limit(3);

        // ── Dynamic reviews for homepage ──
        const reviewModel = require('./models/Review');
        const latestReviews = await reviewModel.find({})
            .sort({ createdAt: -1 })
            .limit(12)
            .lean();

        // Aggregate review stats
        const allReviews = await reviewModel.find({}).lean();
        const totalReviews = allReviews.length;
        let avgRating = '0.0';
        if (totalReviews > 0) {
            const sum = allReviews.reduce((s, r) => s + r.rating, 0);
            avgRating = (sum / totalReviews).toFixed(1);
        }

        // User + experience counts
        const totalUsers = await userModel.countDocuments();
        const totalExperiences = await experienceModel.countDocuments({ status: 'approved' });

        const reviewStats = {
            totalReviews,
            avgRating,
            totalUsers,
            totalExperiences,
        };

        // ── Featured destinations from dataset ──
        const featuredDestinations = exploreData.getFeaturedDestinations();

        // ── Total destinations count from dataset ──
        const totalDestinations = exploreData.STATE_REGISTRY.length;

        res.render("home", {
            user,
            featuredExperiences,
            latestReviews,
            reviewStats,
            featuredDestinations,
            totalDestinations,
            currentUser: req.session.userId,
            userRole:    req.session.userRole
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
        });

        req.session.userId          = newUser._id;
        req.session.userRole        = newUser.role;
        req.session.shopOwnerStatus = newUser.shopApplicationStatus || null;
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

        req.session.userId          = user._id;
        req.session.userRole        = user.role;
        req.session.shopOwnerStatus = user.shopApplicationStatus || null;
        res.redirect('/home');

    } catch (err) {
        console.error(err);
        res.render("login", {
            error: "Something went wrong. Please try again.",
            activeTab: 'login'
        });
    }
});


// ================== PROFILE (DYNAMIC) ==================
const profileController = require('./controllers/profileController');
app.get('/profile', isLoggedIn, profileController.renderProfile);

// ── Profile API endpoints ──
app.post('/api/save-place',   profileController.savePlace);
app.get('/api/saved-places',  profileController.getSavedPlaces);
app.get('/api/profile-stats', profileController.getProfileStats);


// ================== ABOUT PAGE ==================
app.get('/about', async function (req, res) {
    try {
        const Review     = require('./models/Review');
        const user       = req.session.userId ? await userModel.findById(req.session.userId) : null;
        const totalUsers       = await userModel.countDocuments();
        const totalReviews     = await Review.countDocuments();
        const totalExperiences = await experienceModel.countDocuments();

        res.render('about', {
            user,
            currentUser: req.session.userId,
            userRole:    req.session.userRole,
            stats: { totalUsers, totalReviews, totalExperiences }
        });
    } catch (err) {
        console.error('About page error:', err);
        res.render('about', { user: null, currentUser: null, userRole: null, stats: { totalUsers: 0, totalReviews: 0, totalExperiences: 0 } });
    }
});

// ================== EXPLORE DATA UTILITY ==================
const exploreData = require('./utils/exploreData');

// ================== EXPLORE PAGE — All States ==================
app.get('/explore', isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findById(req.session.userId);
        res.render("explore", {
            user,
            currentUser: req.session.userId,
            userRole:    req.session.userRole,
            states:           exploreData.STATES,
            unionTerritories: exploreData.UNION_TERRITORIES,
            categories:       exploreData.CATEGORIES,
            trending:         exploreData.TRENDING_SEARCHES,
        });
    } catch (err) {
        console.error(err);
        res.redirect('/home');
    }
});

// ================== EXPLORE STATE — State Detail ==================
app.get('/explore/category/:type', isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findById(req.session.userId);
        const { category, results } = exploreData.getCategoryResults(req.params.type);

        if (!category) return res.redirect('/explore');

        res.render("category", {
            user,
            currentUser: req.session.userId,
            userRole:    req.session.userRole,
            category,
            results,
        });
    } catch (err) {
        console.error(err);
        res.redirect('/explore');
    }
});

app.get('/explore/:stateId', isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findById(req.session.userId);
        const stateMeta = exploreData.getStateMeta(req.params.stateId);

        if (!stateMeta) return res.redirect('/explore');

        const data = exploreData.getStateData(req.params.stateId);
        if (!data || !data.cities) return res.redirect('/explore');

        const { popular, hiddenGems } = exploreData.classifyCities(data.cities);

        // Mark each city with its classification
        const allCities = data.cities.map(city => {
            const isHidden = hiddenGems.some(h => h.id === city.id);
            return { ...city, _isHiddenGem: isHidden };
        });

        // Hero image: use first city's image or state fallback
        const heroImage = (data.cities[0] && data.cities[0].hero_image) || stateMeta.image;

        const totalPlaces = data.cities.reduce((sum, c) => sum + (c.places ? c.places.length : 0), 0);

        res.render("state", {
            user,
            currentUser: req.session.userId,
            userRole:    req.session.userRole,
            stateMeta,
            cities:           allCities,
            totalCities:      data.cities.length,
            totalPlaces,
            popularCount:     popular.length,
            hiddenGemsCount:  hiddenGems.length,
            heroImage,
        });
    } catch (err) {
        console.error(err);
        res.redirect('/explore');
    }
});

// ================== SEARCH PAGE ==================
app.get('/search', isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findById(req.session.userId);
        const query = (req.query.q || '').trim();
        const results = query ? exploreData.searchAllStates(query) : [];

        res.render("search", {
            user,
            currentUser: req.session.userId,
            userRole:    req.session.userRole,
            query,
            results,
            trending: exploreData.TRENDING_SEARCHES,
        });
    } catch (err) {
        console.error(err);
        res.redirect('/explore');
    }
});

// ================== LIVE SEARCH API ==================
app.get('/api/search', function (req, res) {
    const query = (req.query.q || '').trim();
    if (!query || query.length < 2) return res.json({ results: [] });
    const results = exploreData.searchAllStates(query);
    res.json({ results: results.slice(0, 15) });
});



// ================== CITY DETAIL PAGE ==================
// ✅ NEW — Renders city.ejs (individual city page).
// Query params ?state=punjab&id=amritsar are read client-side in city.ejs,
// Express just needs to serve the view.
app.get('/city', isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findById(req.session.userId);
        res.render("city", {
            user,
            currentUser: req.session.userId,
            userRole:    req.session.userRole
        });
    } catch (err) {
        console.error(err);
        res.redirect('/explore');
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

app.get('/kedarkantha', isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findById(req.session.userId);
        res.render("kedarkanth", {
            user,
            currentUser: req.session.userId,
            userRole:    req.session.userRole
        });
    } catch (err) {
        res.redirect('/home');
    }
});


// ================== EXPERIENCE / HOST / ADMIN ROUTES ==================
app.use('/experiences',       experienceRoutes);
app.use('/host',              hostRoutes);
app.use('/admin/experiences', adminRoutes);

// ================== MARKETPLACE ROUTES ==================
app.use('/marketplace',       marketplaceRoutes);
app.use('/admin/marketplace', marketplaceAdminRoutes);


// ================== TEMP / DEBUG ROUTES ==================
// ⚠️  Delete these before going to production

app.get('/make-admin-temp', isLoggedIn, async function(req, res) {
    await userModel.findByIdAndUpdate(req.session.userId, { role: 'admin' });
    req.session.userRole = 'admin';
    res.send('You are now admin! <a href="/admin/experiences">Go to admin panel</a>');
});

app.get('/debug/session', (req, res) => {
    res.json({
        session:    req.session,
        userId:     req.session.userId   || 'NOT SET ❌',
        userRole:   req.session.userRole || 'NOT SET ❌',
        isLoggedIn: !!req.session.userId,
    });
});

app.get('/debug/experiences', async (req, res) => {
    try {
        const all = await experienceModel.find({});
        res.json({
            totalInDB:   all.length,
            experiences: all.map(e => ({
                id:        e._id,
                title:     e.title,
                status:    e.status,
                hostId:    e.hostId,
                hostName:  e.hostName,
                city:      e.city,
                createdAt: e.createdAt,
            }))
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});

app.get('/debug/me', async (req, res) => {
    if (!req.session.userId) {
        return res.json({ error: 'Not logged in ❌ — go to /login first' });
    }
    try {
        const user = await userModel.findById(req.session.userId);
        res.json({
            id:                    user._id,
            name:                  user.name || user.username,
            email:                 user.email,
            role:                  user.role,
            hostApplicationStatus: user.hostApplicationStatus,
            isHostVerified:        user.isHostVerified,
            sessionRole:           req.session.userRole,
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
            message: '✅ Test experience CREATED successfully!',
            id:      exp._id,
            title:   exp.title,
            status:  exp.status,
            next:    'Visit /debug/experiences to confirm it saved',
        });
    } catch (err) {
        res.json({
            message: '❌ Experience creation FAILED',
            error:   err.message,
        });
    }
});
// ── node-fetch for proxying to external APIs ──
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

// ── Weather API proxy → live temperature for any city ──
app.get('/api/weather', async function(req, res) {
    const city = (req.query.city || '').trim();
    if (!city) return res.status(400).json({ error: 'city query param required' });

    const WEATHER_API_KEY = 'eb3d00df280e4f9da2173317262204';
    const url = `http://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city + ', India')}&aqi=no`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const resp = await fetch(url, {
            headers: { 'User-Agent': 'ExploreIndia/1.0' },
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!resp.ok) {
            return res.status(resp.status).json({ error: 'Weather API error' });
        }

        const data = await resp.json();
        const c = data.current;
        return res.json({
            city:       data.location.name,
            region:     data.location.region,
            temp_c:     c.temp_c,
            feels_like: c.feelslike_c,
            condition:  c.condition.text,
            icon:       'https:' + c.condition.icon,
            humidity:   c.humidity,
            wind_kph:   c.wind_kph,
            is_day:     c.is_day
        });
    } catch (err) {
        console.error('[Weather API Error]', err.message);
        return res.status(500).json({ error: 'Weather data unavailable' });
    }
});


// ── AI Chat proxy → forwards to Flask on :5000 ──

app.post('/api/chat', isLoggedIn, async function(req, res) {
    try {
        const { message, history } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'message required' });
        }

        const flaskRes = await fetch('http://127.0.0.1:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history: history || [] }),
            timeout: 15000
        });

        if (!flaskRes.ok) {
            const errText = await flaskRes.text();
            return res.status(flaskRes.status).json({ error: errText });
        }

        const data = await flaskRes.json();
        return res.json(data);

    } catch (err) {
        console.error('[Chat Proxy Error]', err.message);
        return res.status(500).json({ error: 'AI server unreachable. Is Flask running on port 5000?' });
    }
});
const reviewRoutes = require("./routes/reviewRoutes");
app.use("/reviews", reviewRoutes);


// ================== SERVER ==================
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
