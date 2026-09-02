const User = require('../models/User');
const CheckInLog = require('../models/CheckInLog');
const Booking = require('../models/Booking');

// 1. Get all staff accounts
exports.getAllStaff = async (req, res) => {
  try {
    let staffMembers = [];
    try {
      staffMembers = await User.find({ role: 'staff' }).select('-password').sort({ createdAt: -1 });
    } catch (dbErr) {
      staffMembers = [];
    }

    res.json({ success: true, count: staffMembers.length, data: staffMembers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Create New Staff Account
exports.createStaff = async (req, res) => {
  try {
    const { name, email, phone, password, staffRole, assignedEvents } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists' });
    }

    const newStaff = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password,
      role: 'staff',
      staffRole: staffRole || 'Gate Entry',
      assignedEvents: Array.isArray(assignedEvents) ? assignedEvents : ['ALL'],
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Staff account created successfully',
      data: {
        id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role,
        staffRole: newStaff.staffRole,
        assignedEvents: newStaff.assignedEvents,
        isActive: newStaff.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Update Staff Account Details
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, staffRole, assignedEvents } = req.body;

    const staffUser = await User.findById(id);
    if (!staffUser || staffUser.role !== 'staff') {
      return res.status(404).json({ success: false, message: 'Staff member account not found' });
    }

    if (name) staffUser.name = name;
    if (email) staffUser.email = email.toLowerCase();
    if (phone !== undefined) staffUser.phone = phone;
    if (staffRole) staffUser.staffRole = staffRole;
    if (assignedEvents) staffUser.assignedEvents = assignedEvents;
    if (password && password.length >= 6) {
      staffUser.password = password;
    }

    await staffUser.save();

    res.json({
      success: true,
      message: 'Staff account updated successfully',
      data: {
        id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        phone: staffUser.phone,
        role: staffUser.role,
        staffRole: staffUser.staffRole,
        assignedEvents: staffUser.assignedEvents,
        isActive: staffUser.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Activate / Deactivate Staff Account Access
exports.toggleStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const staffUser = await User.findById(id);

    if (!staffUser || staffUser.role !== 'staff') {
      return res.status(404).json({ success: false, message: 'Staff account not found' });
    }

    staffUser.isActive = !staffUser.isActive;
    await staffUser.save();

    res.json({
      success: true,
      message: `Staff account status changed to ${staffUser.isActive ? 'Active' : 'Deactivated'}`,
      isActive: staffUser.isActive
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delete Staff Account
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'Staff account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Real-Time Attendance Audit Log Stream for Admin Dashboard
exports.getCheckInLogs = async (req, res) => {
  try {
    let logs = [];
    try {
      logs = await CheckInLog.find().sort({ scanTimestamp: -1 }).limit(100);
    } catch (dbErr) {
      logs = [];
    }

    // Get live attendance statistics summary
    let totalCheckedIn = 0;
    try {
      totalCheckedIn = await Booking.countDocuments({ isCheckedIn: true });
    } catch (e) {
      totalCheckedIn = 0;
    }

    res.json({
      success: true,
      totalCheckedIn,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
