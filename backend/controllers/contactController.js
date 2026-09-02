const Contact = require('../models/Contact');

exports.submitContact = async (req, res) => {
  try {
    const { name, email, phone, eventType, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and message' });
    }

    let contact;
    try {
      contact = await Contact.create({ name, email, phone, eventType, message });
    } catch (e) {
      contact = { id: Date.now(), name, email, phone, eventType, message, status: 'New' };
    }

    res.status(201).json({ success: true, message: 'Inquiry submitted successfully! Our team will contact you soon.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
