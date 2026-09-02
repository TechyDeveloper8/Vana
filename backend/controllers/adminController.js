const Event = require('../models/Event');
const Booking = require('../models/Booking');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({
      $or: [{ isPublished: true }, { status: 'Published' }]
    });
    const totalBookings = await Booking.countDocuments();

    // Total revenue sum from confirmed/paid bookings
    const revenueResult = await Booking.aggregate([
      { $match: { paymentStatus: { $in: ['Paid', 'SUCCESS', 'Completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Real Monthly Revenue Chart (Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyLabels = [];
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const mRevenue = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: monthStart, $lte: monthEnd },
            paymentStatus: { $in: ['Paid', 'SUCCESS', 'Completed'] }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

      monthlyLabels.push(monthNames[d.getMonth()]);
      monthlyData.push(mRevenue.length > 0 ? mRevenue[0].total : 0);
    }

    // Real Weekly Bookings (Mon-Sun of current week)
    const weeklyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = [0, 0, 0, 0, 0, 0, 0];

    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekBookings = await Booking.find({
      createdAt: { $gte: startOfWeek }
    });

    weekBookings.forEach((b) => {
      const d = new Date(b.createdAt).getDay();
      const idx = d === 0 ? 6 : d - 1; // Map Sunday=0 to 6, Mon=1 to 0
      weeklyData[idx] += 1;
    });

    res.json({
      success: true,
      stats: {
        totalEvents,
        activeEvents,
        totalBookings,
        totalRevenue,
        monthlyChart: {
          labels: monthlyLabels,
          data: monthlyData
        },
        weeklyBookingsChart: {
          labels: weeklyLabels,
          data: weeklyData
        }
      }
    });
  } catch (error) {
    console.error('getDashboardStats Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
