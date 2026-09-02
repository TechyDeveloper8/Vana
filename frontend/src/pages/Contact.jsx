import React, { useState } from 'react';
import { fetchAPI } from '../services/api';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', eventType: 'Corporate Events', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchAPI('/contact', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setSubmitted(true);
    } catch (err) {
      alert('Error submitting inquiry: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-padding" style={{ padding: '60px 0', background: '#F8EFE8', minHeight: '85vh' }}>
      <div className="container">
        <div className="section-header">
          <span className="sub-badge">Get In Touch</span>
          <h2>Let’s Architect Something Extraordinary</h2>
          <p>Contact our event strategists to discuss your upcoming project or request a proposal.</p>
        </div>

        <div className="grid-2col" style={{ marginTop: '36px' }}>
          <div className="white-card" style={{ padding: '30px 24px', borderRadius: '20px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Send Us An Inquiry</h3>
            {submitted ? (
              <div style={{ background: '#dcfce7', color: '#166534', padding: '24px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: '1.2rem', marginRight: '8px' }}></i>
                Thank you! Your inquiry has been transmitted to our senior event directors. We will contact you within 24 hours.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter your full name" />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter email address" />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Enter mobile number" />
                </div>
                <div className="form-group">
                  <label>Event Classification</label>
                  <select value={formData.eventType} onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}>
                    <option value="Corporate Events">Corporate Summits & AGMs</option>
                    <option value="Concerts">Music Concerts & Star Nights</option>
                    <option value="Exhibitions & Expos">Exhibitions & Trade Fairs</option>
                    <option value="Award Shows">Award Shows & Televised Galas</option>
                    <option value="General Inquiry">General Event Inquiry</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Event Requirements</label>
                  <textarea rows="4" required value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Provide event date, location, expected guests, and budget expectations..."></textarea>
                </div>
                <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                  {loading ? 'Transmitting Inquiry...' : 'Submit Custom Inquiry'}
                </button>
              </form>
            )}
          </div>

          <div>
            <div style={{ background: '#111827', color: '#FFFFFF', padding: '30px 24px', borderRadius: '20px', marginBottom: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
              <h3 style={{ color: '#D4AF37', marginBottom: '20px', fontSize: '1.4rem', fontFamily: 'Playfair Display, serif' }}>Corporate Headquarters</h3>
              <p style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: '#E5E7EB' }}>
                <i className="fa-solid fa-location-dot" style={{ color: '#D4AF37', fontSize: '1.1rem' }}></i> Karmanchak, Bhagalpur, Bihar - 812001
              </p>
              <p style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: '#E5E7EB' }}>
                <i className="fa-solid fa-envelope" style={{ color: '#D4AF37', fontSize: '1.1rem' }}></i> enquiry@vanaentertainments.com
              </p>
              <p style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: '#E5E7EB' }}>
                <i className="fa-solid fa-phone" style={{ color: '#D4AF37', fontSize: '1.1rem' }}></i> +91-9798988829
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: '#E5E7EB' }}>
                <i className="fa-solid fa-globe" style={{ color: '#D4AF37', fontSize: '1.1rem' }}></i> www.vanaentertainments.com
              </p>
            </div>

            {/* Embedded Location Map Preview */}
            <div style={{ borderRadius: '20px', overflow: 'hidden', height: '220px', border: '1px solid #E7DDD1', boxShadow: '0 10px 30px rgba(31,31,31,0.06)' }}>
              <iframe
                title="Vana Headquarters Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.824214227361!2d86.974443!3d25.244321!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDE0JzM5LjYiTiA4NsKwNTgnMjguMCJF!5e0!3m2!1sen!2sin!4v1650000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
