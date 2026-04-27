const ShopApplication = require('../models/ShopApplication');
const User = require('../models/user');

// ══════════════════════════════════════════════════════════════════════════════
// GET /admin/marketplace — View all shop applications
// ══════════════════════════════════════════════════════════════════════════════
const getApplications = async (req, res) => {
  try {
    const applications = await ShopApplication.find({})
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .lean();

    const stats = {
      total: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      approved: applications.filter(a => a.status === 'approved').length,
      rejected: applications.filter(a => a.status === 'rejected').length
    };

    res.render('admin/marketplace', {
      applications,
      stats,
      currentUser: req.session.userId,
      userRole: req.session.userRole,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error('Admin marketplace error:', err);
    res.redirect('/home');
  }
};


// ══════════════════════════════════════════════════════════════════════════════
// PUT /admin/marketplace/approve/:id — Approve application
// ══════════════════════════════════════════════════════════════════════════════
const approveApplication = async (req, res) => {
  try {
    const application = await ShopApplication.findById(req.params.id);
    if (!application) {
      req.flash('error', 'Application not found.');
      return res.redirect('/admin/marketplace');
    }

    application.status = 'approved';
    await application.save();

    // Update user role and status
    await User.findByIdAndUpdate(application.userId, {
      shopApplicationStatus: 'approved',
      shopName: application.shopName
    });

    req.flash('success', `Application from "${application.shopName}" approved!`);
    res.redirect('/admin/marketplace');
  } catch (err) {
    console.error('Approve error:', err);
    req.flash('error', 'Failed to approve application.');
    res.redirect('/admin/marketplace');
  }
};


// ══════════════════════════════════════════════════════════════════════════════
// PUT /admin/marketplace/reject/:id — Reject application
// ══════════════════════════════════════════════════════════════════════════════
const rejectApplication = async (req, res) => {
  try {
    const application = await ShopApplication.findById(req.params.id);
    if (!application) {
      req.flash('error', 'Application not found.');
      return res.redirect('/admin/marketplace');
    }

    application.status = 'rejected';
    await application.save();

    // Update user status
    await User.findByIdAndUpdate(application.userId, {
      shopApplicationStatus: 'rejected'
    });

    req.flash('success', `Application from "${application.shopName}" rejected.`);
    res.redirect('/admin/marketplace');
  } catch (err) {
    console.error('Reject error:', err);
    req.flash('error', 'Failed to reject application.');
    res.redirect('/admin/marketplace');
  }
};


module.exports = {
  getApplications,
  approveApplication,
  rejectApplication
};
