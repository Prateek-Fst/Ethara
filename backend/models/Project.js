const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        role: {
          type: String,
          enum: ['Admin', 'Member'],
          default: 'Member'
        }
      }
    ],
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Archived'],
      default: 'Active'
    }
  },
  { timestamps: true }
);

const idOf = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (v._id) return v._id.toString();
  return v.toString();
};

projectSchema.methods.isMember = function (userId) {
  const uid = idOf(userId);
  return (
    idOf(this.owner) === uid ||
    this.members.some((m) => idOf(m.user) === uid)
  );
};

projectSchema.methods.isAdmin = function (userId) {
  const uid = idOf(userId);
  if (idOf(this.owner) === uid) return true;
  const member = this.members.find((m) => idOf(m.user) === uid);
  return member && member.role === 'Admin';
};

module.exports = mongoose.model('Project', projectSchema);
