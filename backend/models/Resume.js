const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    experience: [{
      title: String,
      company: String,
      duration: String,
      description: String
    }],
    education: [{
      degree: String,
      institution: String,
      year: String,
      gpa: String
    }],
    skills: [String],
    projects: [{
      title: String,
      description: String,
      link: String
    }]
  },
  summary: {
    type: String
  },
  fileUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed'],
    default: 'draft'
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  assignedAlumni: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);