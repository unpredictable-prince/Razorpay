import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  KeyRound,
  User,
  Store,
  Phone,
  UserPlus,
  LogIn,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

export default function LoginPage({ onLogin }) {
  // Auth Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');

  // Role Selection: 'merchant' | 'customer'
  const [selectedRole, setSelectedRole] = useState('merchant');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('admin@aurastore.com');
  const [loginPassword, setLoginPassword] = useState('merchant123');

  // Merchant Register Form State
  const [regName, setRegName] = useState('');
  const [regStoreName, setRegStoreName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRazorpayKey, setRegRazorpayKey] = useState('');

  // Customer Register Form State
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custConfirmPassword, setCustConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preset Demo Merchants
  const DEMO_MERCHANTS = [
    { name: 'Vikram Sharma', store_name: 'Aura Trends India', email: 'admin@aurastore.com', phone: '+91 98765 43210', razorpay_key: 'rzp_test_TUJ1LFMpXuNekP' },
    { name: 'Rohan Gupta', store_name: 'Apex Electronics', email: 'rohan@apexelectronics.in', phone: '+91 98111 22334', razorpay_key: 'rzp_test_APEX88900' },
  ];

  // Preset Demo Customers
  const DEMO_CUSTOMERS = [
    { name: 'Sam', email: 'sam@gmail.com', phone: '+91 9876543210', address: 'Flat 402, Sunset Heights, Bandra West, Mumbai, MH 400050' },
    { name: 'Priya Singh', email: 'priya.singh@example.com', phone: '+91 9765432109', address: '88 Sector 15, Noida, UP 201301' },
  ];

  // Handle Sign In Submit
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      setIsSubmitting(false);

      if (selectedRole === 'merchant') {
        const saved = localStorage.getItem('recoverai_merchant_profile');
        let merchantData = null;
        if (saved) {
          try {
            merchantData = JSON.parse(saved);
          } catch (err) {
            console.error(err);
          }
        }

        if (!merchantData) {
          merchantData = {
            name: 'Vikram Sharma',
            store_name: 'Aura Trends India',
            email: loginEmail || 'admin@aurastore.com',
            phone: '+91 98765 43210',
            merchant_id: 'mch_aura_admin',
            category: 'E-Commerce & Digital Commerce',
            razorpay_key: 'rzp_test_TUJ1LFMpXuNekP',
            webhook_secret: 'recoverai_test_webhook_secret',
            plan: 'Enterprise Autonomous Recovery',
            status: 'Verified & Active',
            joined_date: 'Just Now',
          };
          localStorage.setItem('recoverai_merchant_profile', JSON.stringify(merchantData));
        }

        localStorage.setItem('recoverai_auth', 'true');
        onLogin(merchantData);
      } else {
        // Customer login from Merchant portal
        const matched = DEMO_CUSTOMERS.find((c) => c.email.toLowerCase() === loginEmail.toLowerCase());
        const loggedUser = matched || {
          name: loginEmail.split('@')[0].toUpperCase(),
          email: loginEmail,
          phone: '+91 9876543210',
          address: '74 Park Street, Kolkata, WB 700016',
        };
        localStorage.setItem('aura_customer', JSON.stringify(loggedUser));
        localStorage.setItem('aura_customer_logged_in', 'true');
        window.location.href = 'http://localhost:5174';
      }
    }, 500);
  };

  // Handle Merchant Register
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!regName.trim() || !regStoreName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please fill in all required merchant registration fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const newMerchant = {
        name: regName,
        store_name: regStoreName,
        email: regEmail,
        phone: regPhone || '+91 98765 43210',
        merchant_id: `mch_${regStoreName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.floor(1000 + Math.random() * 9000)}`,
        category: 'E-Commerce & Digital Commerce',
        razorpay_key: regRazorpayKey || 'rzp_test_TUJ1LFMpXuNekP',
        webhook_secret: 'recoverai_test_webhook_secret',
        plan: 'Enterprise Autonomous Recovery',
        status: 'Verified & Active',
        joined_date: 'Just Now',
      };

      localStorage.setItem('recoverai_merchant_profile', JSON.stringify(newMerchant));
      localStorage.setItem('recoverai_auth', 'true');
      onLogin(newMerchant);
    }, 600);
  };

  // Handle Customer Register from Merchant Portal
  const handleCustomerRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!custName.trim() || !custEmail.trim() || !custPhone.trim() || !custPassword.trim()) {
      setError('Please complete all required customer registration fields.');
      return;
    }

    if (custPassword !== custConfirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const newCustomer = {
        name: custName,
        email: custEmail,
        phone: custPhone,
        address: custAddress || '15 MG Road, Indiranagar, Bengaluru, KA 560038',
        customer_id: `cust_aura_${Math.floor(1000 + Math.random() * 9000)}`,
        joined: 'Just Now',
      };

      localStorage.setItem('aura_customer', JSON.stringify(newCustomer));
      localStorage.setItem('aura_customer_logged_in', 'true');
      window.location.href = 'http://localhost:5174';
    }, 600);
  };

  // Quick Demo Merchant Login
  const handleQuickDemoLogin = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      localStorage.setItem('recoverai_auth', 'true');
      onLogin();
    }, 400);
  };

  // Quick Demo Customer Login
  const handleQuickCustomerLogin = (c) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      localStorage.setItem('aura_customer', JSON.stringify(c));
      localStorage.setItem('aura_customer_logged_in', 'true');
      window.location.href = 'http://localhost:5174';
    }, 400);
  };

  return (
    <div className="login-wrapper">
      {/* Ambient background glow elements */}
      <div className="glow-sphere glow-1"></div>
      <div className="glow-sphere glow-2"></div>

      <div className="login-card" style={{ maxWidth: '480px' }}>
        {/* Brand Header */}
        <div className="login-brand">
          <div className="brand-icon-lg">
            <ShieldCheck size={32} color="#ffffff" />
          </div>
          <h1 className="login-title">RecoverAI & Aura Portal</h1>
          <p className="login-subtitle">Unified Merchant Console & Customer Portal</p>
        </div>

        {/* Tab 1: Auth Mode Switcher (Sign In vs Register) */}
        <div className="auth-tab-switcher">
          <button
            type="button"
            className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => { setAuthMode('login'); setError(''); }}
          >
            <LogIn size={16} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => { setAuthMode('register'); setError(''); }}
          >
            <UserPlus size={16} />
            <span>Register</span>
          </button>
        </div>

        {/* Tab 2: Role Selector (Merchant vs Customer) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          <button
            type="button"
            onClick={() => {
              setSelectedRole('merchant');
              setLoginEmail('admin@aurastore.com');
              setLoginPassword('merchant123');
              setError('');
            }}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: selectedRole === 'merchant' ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
              background: selectedRole === 'merchant' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: selectedRole === 'merchant' ? '#a5b4fc' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Store size={16} color={selectedRole === 'merchant' ? '#818cf8' : '#64748b'} />
            <span>Merchant (Seller)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('customer');
              setLoginEmail('sam@gmail.com');
              setLoginPassword('customer123');
              setError('');
            }}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: selectedRole === 'customer' ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
              background: selectedRole === 'customer' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: selectedRole === 'customer' ? '#c084fc' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ShoppingBag size={16} color={selectedRole === 'customer' ? '#c084fc' : '#64748b'} />
            <span>Customer (Buyer)</span>
          </button>
        </div>

        {error && <div className="login-error-alert">{error}</div>}

        {/* --- SIGN IN MODE --- */}
        {authMode === 'login' ? (
          <>
            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">
                  {selectedRole === 'merchant' ? 'Merchant Business Email' : 'Customer Email'}
                </label>
                <div className="input-icon-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={selectedRole === 'merchant' ? 'admin@aurastore.com' : 'sam@gmail.com'}
                    className="login-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-icon-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="login-input"
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-login-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  'Authenticating...'
                ) : (
                  <>
                    <span>{selectedRole === 'merchant' ? 'Sign In to Merchant Console' : 'Sign In to Aura Store'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="login-divider">
              <span>OR QUICK DEMO</span>
            </div>

            {selectedRole === 'merchant' ? (
              <button type="button" onClick={handleQuickDemoLogin} className="btn-login-demo">
                <Sparkles size={18} color="#6366f1" />
                <span>Quick Demo Merchant Sign In</span>
              </button>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {DEMO_CUSTOMERS.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleQuickCustomerLogin(c)}
                    style={{
                      padding: '10px',
                      background: 'rgba(168, 85, 247, 0.12)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '10px',
                      color: '#e9d5ff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <User size={15} color="#c084fc" />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* --- REGISTER MODE --- */
          selectedRole === 'merchant' ? (
            <form onSubmit={handleRegisterSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div className="input-icon-wrapper">
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    className="login-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Store / Company Name *</label>
                <div className="input-icon-wrapper">
                  <Store className="input-icon" size={18} />
                  <input
                    type="text"
                    value={regStoreName}
                    onChange={(e) => setRegStoreName(e.target.value)}
                    placeholder="e.g. Aura Trends India"
                    className="login-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Business Email *</label>
                <div className="input-icon-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="vikram@auratrends.com"
                    className="login-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Razorpay Public Key ID (Optional)</label>
                <div className="input-icon-wrapper">
                  <KeyRound className="input-icon" size={18} />
                  <input
                    type="text"
                    value={regRazorpayKey}
                    onChange={(e) => setRegRazorpayKey(e.target.value)}
                    placeholder="rzp_test_..."
                    className="login-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="login-input"
                    style={{ paddingLeft: '14px' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm *</label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="login-input"
                    style={{ paddingLeft: '14px' }}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-login-primary" style={{ marginTop: '8px' }} disabled={isSubmitting}>
                {isSubmitting ? (
                  'Registering Account...'
                ) : (
                  <>
                    <span>Create Merchant Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Customer Register Form */
            <form onSubmit={handleCustomerRegisterSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div className="input-icon-wrapper">
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    className="login-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <div className="input-icon-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="ananya@example.com"
                    className="login-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone *</label>
                <div className="input-icon-wrapper">
                  <Phone className="input-icon" size={18} />
                  <input
                    type="tel"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="login-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    value={custPassword}
                    onChange={(e) => setCustPassword(e.target.value)}
                    placeholder="••••••••"
                    className="login-input"
                    style={{ paddingLeft: '14px' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm *</label>
                  <input
                    type="password"
                    value={custConfirmPassword}
                    onChange={(e) => setCustConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="login-input"
                    style={{ paddingLeft: '14px' }}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-login-primary" style={{ marginTop: '8px', background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' }} disabled={isSubmitting}>
                {isSubmitting ? (
                  'Registering Customer...'
                ) : (
                  <>
                    <span>Register & Open Aura Store</span>
                    <ExternalLink size={18} />
                  </>
                )}
              </button>
            </form>
          )
        )}

        {/* Security & System Features */}
        <div className="login-security-features">
          <div className="sec-feature">
            <CheckCircle2 size={14} color="#10b981" />
            <span>HMAC-SHA256 Encrypted Webhook Relays</span>
          </div>
          <div className="sec-feature">
            <CheckCircle2 size={14} color="#10b981" />
            <span>Deterministic Policy Guardrails Active</span>
          </div>
          <div className="sec-feature">
            <CheckCircle2 size={14} color="#10b981" />
            <span>Razorpay Test Sandbox Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
