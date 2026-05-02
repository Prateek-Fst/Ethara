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

projectSchema.methods.isMember = function (userId) {
  return (
    this.owner.toString() === userId.toString() ||
    this.members.some((m) => m.user.toString() === userId.toString())
  );
};

projectSchema.methods.isAdmin = function (userId) {
  if (this.owner.toString() === userId.toString()) return true;
  const member = this.members.find((m) => m.user.toString() === userId.toString());
  return member && member.role === 'Admin';
};

module.exports = mongoose.model('Project', projectSchema);
