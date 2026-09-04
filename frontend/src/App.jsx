import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import BookTicket from './pages/BookTicket';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import UserDashboard from './pages/UserDashboard';

import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminEvents from './pages/AdminEvents';
import AdminSeating from './pages/AdminSeating';
import AdminGallery from './pages/AdminGallery';
import AdminStaff from './pages/AdminStaff';
import AdminBookings from './pages/AdminBookings';

import StaffLogin from './pages/StaffLogin';
import StaffPortal from './pages/StaffPortal';
import StaffScanner from './pages/StaffScanner';

export default function App() {
  const location = useLocation();
  const isNoHeaderPath =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/staff');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isNoHeaderPath && <Navbar />}

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/book-ticket/:id?" element={<BookTicket />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsConditions />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />


          {/* Dedicated Independent Staff Gate Verification Portal */}
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route
            path="/staff/portal"
            element={
              <ProtectedRoute>
                <StaffPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/scan/:eventId"
            element={
              <ProtectedRoute>
                <StaffScanner />
              </ProtectedRoute>
            }
          />

          {/* Admin Portal Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/seating"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminSeating />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/gallery"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminGallery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminStaff />
              </ProtectedRoute>
            }
          />
          {/* Catch-all Fallback for invalid or non-existent URLs */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isNoHeaderPath && <Footer />}
    </div>
  );
}
