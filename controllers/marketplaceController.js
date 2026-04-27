const User = require('../models/user');
const ShopApplication = require('../models/ShopApplication');
const MarketplaceProduct = require('../models/MarketplaceProduct');
const MarketplaceReview = require('../models/MarketplaceReview');

// ── Indian States for dropdown ───────────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
];


// ══════════════════════════════════════════════════════════════════════════════
// GET /marketplace — Explore page with filters
// ══════════════════════════════════════════════════════════════════════════════
const getExplore = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    // Build filter query
    const filter = { status: 'active' };
    const { state, city, minPrice, maxPrice, search } = req.query;

    if (state && state.trim()) filter.state = state.trim();
    if (city && city.trim()) filter.city = { $regex: city.trim(), $options: 'i' };
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { shopName: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const products = await MarketplaceProduct.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Get unique states from products for filter dropdown
    const allProducts = await MarketplaceProduct.find({ status: 'active' }).distinct('state');

    res.render('marketplace/explore', {
      user,
      products,
      availableStates: allProducts,
      indianStates: INDIAN_STATES,
      filters: { state: state || '', city: city || '', minPrice: minPrice || '', maxPrice: maxPrice || '', search: search || '' },
      currentUser: req.session.userId,
      userRole: req.session.userRole
    });
  } catch (err) {
    console.error('Marketplace explore error:', err);
    res.redirect('/home');
  }
};


// ══════════════════════════════════════════════════════════════════════════════
// GET /marketplace/product/:id — Product detail page
// ══════════════════════════════════════════════════════════════════════════════
const getProductDetail = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const product = await MarketplaceProduct.findById(req.params.id).lean();

    if (!product || product.status !== 'active') {
      return res.redirect('/marketplace');
    }

    const reviews = await MarketplaceReview.find({ productId: product._id })
      .sort({ createdAt: -1 })
      .lean();

    // Check if user already reviewed
    const hasReviewed = reviews.some(r => r.userId.toString() === req.session.userId);

    res.render('marketplace/product', {
      user,
      product,
      reviews,
      hasReviewed,
      currentUser: req.session.userId,
      userRole: req.session.userRole
    });
  } catch (err) {
    console.error('Product detail error:', err);
    res.redirect('/marketplace');
  }
};


// ══════════════════════════════════════════════════════════════════════════════
// GET /marketplace/apply — Shop owner application form
// ══════════════════════════════════════════════════════════════════════════════
const getApplyForm = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    // Check if already applied
    const existingApplication = await ShopApplication.findOne({ userId: req.session.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.render('marketplace/apply', {
      user,
      existingApplication,
      indianStates: INDIAN_STATES,
      currentUser: req.session.userId,
      userRole: req.session.userRole,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error('Apply form error:', err);
    res.redirect('/marketplace');
  }
};


// ══════════════════════════════════════════════════════════════════════════════
// POST /marketplace/apply — Submit shop owner application
// ══════════════════════════════════════════════════════════════════════════════
const postApply = async (req, res) => {
  try {
    const { fullName, shopName, mobile, state, city, description } = req.body;

    if (!fullName || !shopName || !mobile || !state || !city || !description) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/marketplace/apply');
    }

    // Check if already has a pending/approved application
    const existing = await ShopApplication.findOne({
      userId: req.session.userId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existing) {
      req.flash('error', 'You already have an active application.');
      return res.redirect('/marketplace/apply');
    }

    await ShopApplication.create({
      userId: req.session.userId,
      fullName,
      shopName,
      mobile,
      state,
      city,
      description,
      status: 'pending'
    });

    // Update user's shopApplicationStatus
    await User.findByIdAndUpdate(req.session.userId, {
      shopApplicationStatus: 'pending'
    });

    req.flash('success', 'Your application has been submitted! You will be notified once approved.');
    res.redirect('/marketplace/apply');
  } catch (err) {
    console.error('Apply error:', err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/marketplace/apply');
  }
};


// ══════════════════════════════════════════════════════════════════════════════
// GET /marketplace/add-product — Add product form (approved shop owners only)
// ══════════════════════════════════════════════════════════════════════════════
const getAddProduct = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    res.render('marketplace/add-product', {
      user,
      indianStates: INDIAN_STATES,
      currentUser: req.session.userId,
      userRole: req.session.userRole,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error('Add product form error:', err);
    res.redirect('/marketplace');
  }
};


// ══════════════════════════════════════════════════════════════════════════════
// POST /marketplace/add-product — Submit new product (with multer images)
// ══════════════════════════════════════════════════════════════════════════════
const postAddProduct = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const { title, price, description, state, city, exactLocation, contactNumber } = req.body;

    if (!title || !price) {
      req.flash('error', 'Title and price are required.');
      return res.redirect('/marketplace/add-product');
    }

    // Get uploaded image paths
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push('/uploads/marketplace/' + file.filename);
      });
    }

    // Also support URL-based images
    if (req.body.imageUrls) {
      const urls = req.body.imageUrls.split(',').map(u => u.trim()).filter(Boolean);
      images.push(...urls);
    }

    // Get shop name from application
    const application = await ShopApplication.findOne({
      userId: req.session.userId,
      status: 'approved'
    });

    await MarketplaceProduct.create({
      sellerId: user._id,
      sellerName: user.name,
      shopName: application ? application.shopName : user.shopName || '',
      title,
      price: Number(price),
      description: description || '',
      state: state || '',
      city: city || '',
      exactLocation: exactLocation || '',
      contactNumber: contactNumber || '',
      images,
      status: 'active'
    });

    req.flash('success', 'Product listed successfully!');
    res.redirect('/marketplace');
  } catch (err) {
    console.error('Add product error:', err);
    req.flash('error', 'Failed to list product. Please try again.');
    res.redirect('/marketplace/add-product');
  }
};


// ══════════════════════════════════════════════════════════════════════════════
// POST /marketplace/product/:id/review — Add review
// ══════════════════════════════════════════════════════════════════════════════
const postReview = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const { rating, comment } = req.body;
    const productId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      req.flash('error', 'Please select a rating between 1 and 5.');
      return res.redirect(`/marketplace/product/${productId}`);
    }

    // Check if already reviewed
    const existing = await MarketplaceReview.findOne({
      productId,
      userId: req.session.userId
    });

    if (existing) {
      req.flash('error', 'You have already reviewed this product.');
      return res.redirect(`/marketplace/product/${productId}`);
    }

    await MarketplaceReview.create({
      productId,
      userId: user._id,
      username: user.name,
      rating: Number(rating),
      comment: comment || ''
    });

    // Recalculate average rating
    const allReviews = await MarketplaceReview.find({ productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await MarketplaceProduct.findByIdAndUpdate(productId, {
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length
    });

    req.flash('success', 'Review added successfully!');
    res.redirect(`/marketplace/product/${productId}`);
  } catch (err) {
    console.error('Review error:', err);
    req.flash('error', 'Failed to add review.');
    res.redirect(`/marketplace/product/${req.params.id}`);
  }
};


module.exports = {
  getExplore,
  getProductDetail,
  getApplyForm,
  postApply,
  getAddProduct,
  postAddProduct,
  postReview
};
