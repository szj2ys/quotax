/**
 * User Model
 * Schema for B2B supplier user accounts
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // WeChat OpenID - unique identifier from WeChat
  openid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Basic WeChat info
  nickName: {
    type: String,
    default: '',
  },
  avatarUrl: {
    type: String,
    default: '',
  },

  // Company Information
  companyName: {
    type: String,
    default: '',
  },
  companyLogo: {
    type: String,
    default: '',
  },
  companyDescription: {
    type: String,
    default: '',
  },

  // Contact Information
  contactName: {
    type: String,
    default: '',
  },
  contactPhone: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
    trim: true,
    lowercase: true,
  },

  // Notification Preferences
  notificationPreferences: {
    daily: {
      type: Boolean,
      default: true,
    },
    weekly: {
      type: Boolean,
      default: true,
    },
    monthly: {
      type: Boolean,
      default: true,
    },
    newLead: {
      type: Boolean,
      default: true,
    },
  },

  // Account status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },

  // User role
  role: {
    type: String,
    enum: ['supplier', 'admin'],
    default: 'supplier',
  },

  // Quotation page slug for sharing
  slug: {
    type: String,
    unique: true,
    sparse: true,
  },

  // Analytics - total view count
  totalViews: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for slug lookup
userSchema.index({ slug: 1 });

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    nickName: this.nickName,
    avatarUrl: this.avatarUrl,
    companyName: this.companyName,
    companyLogo: this.companyLogo,
    companyDescription: this.companyDescription,
    contactName: this.contactName,
    contactPhone: this.contactPhone,
    email: this.email,
    notificationPreferences: this.notificationPreferences,
    slug: this.slug,
  };
};

// Static method to find by openid
userSchema.statics.findByOpenId = function(openid) {
  return this.findOne({ openid });
};

// Static method to find by slug
userSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug });
};

module.exports = mongoose.model('User', userSchema);
