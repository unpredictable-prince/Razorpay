import React, { useState, useEffect } from 'react';
import { User, Store, Mail, Phone, ShieldCheck, Key, CreditCard, Copy, Check, X, Award, Globe, Edit3, Save } from 'lucide-react';

export default function MerchantProfileModal({ isOpen, onClose, merchant, stats, onSaveMerchant }) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const defaultMerchant = {
    name: 'Aura Store Admin',
    store_name: 'Aura Store E-Commerce',
    email: 'admin@aurastore.com',
    phone: '+91 98765 43210',
    merchant_id: 'mch_aura_99812',
    category: 'E-Commerce & Direct-to-Consumer',
    razorpay_key: 'rzp_test_TUJ1LFMpXuNekP',
    webhook_secret: 'recoverai_test_webhook_secret',
    plan: 'Enterprise Autonomous Recovery',
    status: 'Verified & Active',
    joined_date: 'Jan 2026',
  };

  const [formData, setFormData] = useState(merchant || defaultMerchant);

  useEffect(() => {
    if (merchant) {
      setFormData(merchant);
    }
  }, [merchant]);

  if (!isOpen) return null;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(formData.webhook_secret || defaultMerchant.webhook_secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('recoverai_merchant_profile', JSON.stringify(formData));
    if (onSaveMerchant) {
      onSaveMerchant(formData);
    }
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const formatINR = (paise) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format((paise || 0) / 100);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content merchant-profile-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="profile-avatar-lg">
              <Store size={24} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                {formData.store_name || defaultMerchant.store_name}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Merchant Profile & Razorpay API Settings
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn-reset"
                style={{ padding: '6px 14px', background: 'var(--color-brand)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit3 size={15} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-reset"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
            )}

            <button onClick={onClose} className="btn-close" title="Close Profile">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Save Confirmation Alert */}
        {saveSuccess && (
          <div style={{ padding: '10px 16px', background: 'var(--color-success-bg)', borderBottom: '1px solid var(--color-success-border)', color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} />
            <span>Merchant Profile updated successfully!</span>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSave} className="modal-body" style={{ gap: '20px' }}>
          {/* Quick Metrics Header */}
          <div className="profile-metrics-row">
            <div className="profile-mini-card">
              <span className="mini-label">Merchant Status</span>
              <div className="mini-val" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} />
                <span>{formData.status || 'Verified & Active'}</span>
              </div>
            </div>

            <div className="profile-mini-card">
              <span className="mini-label">Subscription Plan</span>
              <div className="mini-val" style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={16} />
                <span>{formData.plan || 'Enterprise Pro'}</span>
              </div>
            </div>

            <div className="profile-mini-card">
              <span className="mini-label">Total Recovered</span>
              <div className="mini-val" style={{ color: '#10b981' }}>
                {formatINR(stats?.recovered_revenue || 0)}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="profile-details-grid">
            {/* OWNER INFO CARD */}
            <div className="profile-section-card">
              <h3 className="profile-sec-title">
                <User size={16} color="#6366f1" /> Account Owner Information
              </h3>
              <div className="profile-field-list">
                <div className="field-item" style={{ flexDirection: isEditing ? 'column' : 'row', alignItems: isEditing ? 'flex-start' : 'center', gap: isEditing ? '4px' : '0' }}>
                  <span className="field-name">Owner Name</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="login-input"
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  ) : (
                    <span className="field-val">{formData.name || defaultMerchant.name}</span>
                  )}
                </div>

                <div className="field-item" style={{ flexDirection: isEditing ? 'column' : 'row', alignItems: isEditing ? 'flex-start' : 'center', gap: isEditing ? '4px' : '0' }}>
                  <span className="field-name">Business Email</span>
                  {isEditing ? (
                    <input
                      type="email"
                      className="login-input"
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  ) : (
                    <span className="field-val">{formData.email || defaultMerchant.email}</span>
                  )}
                </div>

                <div className="field-item" style={{ flexDirection: isEditing ? 'column' : 'row', alignItems: isEditing ? 'flex-start' : 'center', gap: isEditing ? '4px' : '0' }}>
                  <span className="field-name">Phone Number</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="login-input"
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  ) : (
                    <span className="field-val">{formData.phone || defaultMerchant.phone}</span>
                  )}
                </div>

                <div className="field-item">
                  <span className="field-name">Merchant ID</span>
                  <span className="field-val code-font">{formData.merchant_id || defaultMerchant.merchant_id}</span>
                </div>
              </div>
            </div>

            {/* BUSINESS CONFIG CARD */}
            <div className="profile-section-card">
              <h3 className="profile-sec-title">
                <Globe size={16} color="#6366f1" /> Business & Store Config
              </h3>
              <div className="profile-field-list">
                <div className="field-item" style={{ flexDirection: isEditing ? 'column' : 'row', alignItems: isEditing ? 'flex-start' : 'center', gap: isEditing ? '4px' : '0' }}>
                  <span className="field-name">Store Name</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="login-input"
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      value={formData.store_name || ''}
                      onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                      required
                    />
                  ) : (
                    <span className="field-val">{formData.store_name || defaultMerchant.store_name}</span>
                  )}
                </div>

                <div className="field-item" style={{ flexDirection: isEditing ? 'column' : 'row', alignItems: isEditing ? 'flex-start' : 'center', gap: isEditing ? '4px' : '0' }}>
                  <span className="field-name">Industry Category</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="login-input"
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  ) : (
                    <span className="field-val">{formData.category || defaultMerchant.category}</span>
                  )}
                </div>

                <div className="field-item">
                  <span className="field-name">Connected Store UI</span>
                  <span className="field-val">http://localhost:5174</span>
                </div>

                <div className="field-item">
                  <span className="field-name">Member Since</span>
                  <span className="field-val">{formData.joined_date || defaultMerchant.joined_date}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security & API Credentials Section */}
          <div className="profile-section-card" style={{ background: '#0f172a' }}>
            <h3 className="profile-sec-title">
              <Key size={16} color="#818cf8" /> Razorpay & Webhook API Credentials
            </h3>

            <div className="profile-field-list" style={{ gap: '12px', marginTop: '10px' }}>
              <div className="cred-row" style={{ flexDirection: isEditing ? 'column' : 'row', alignItems: isEditing ? 'flex-start' : 'center', gap: isEditing ? '8px' : '0' }}>
                <div style={{ width: '100%' }}>
                  <span className="field-name">Razorpay Public Key ID</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="login-input code-font"
                      style={{ padding: '6px 10px', fontSize: '0.85rem', marginTop: '4px' }}
                      value={formData.razorpay_key || ''}
                      onChange={(e) => setFormData({ ...formData, razorpay_key: e.target.value })}
                    />
                  ) : (
                    <p className="code-font" style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '2px' }}>
                      {formData.razorpay_key || defaultMerchant.razorpay_key}
                    </p>
                  )}
                </div>
                <span className="badge badge-approved" style={{ alignSelf: 'flex-start' }}>Test Mode Active</span>
              </div>

              <div className="cred-row">
                <div>
                  <span className="field-name">HMAC-SHA256 Webhook Secret</span>
                  <p className="code-font" style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '2px' }}>
                    {formData.webhook_secret || defaultMerchant.webhook_secret}
                  </p>
                </div>
                <button type="button" onClick={handleCopySecret} className="btn-reset" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Secret'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SAVE CHANGES BUTTON */}
          {isEditing && (
            <button
              type="submit"
              className="btn-login-primary"
              style={{ marginTop: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}
            >
              <Save size={18} />
              <span>Save Merchant Changes</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
