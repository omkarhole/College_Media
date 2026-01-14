import { useState, useEffect } from 'react';
import api from '../services/api'; 
import { Plus, Trash2, Upload, Save, Sparkles, Download, Eye, Shield, CheckCircle, AlertCircle, AlertTriangle, Target, TrendingUp } from 'lucide-react';

const ResumeBuilder = () => {
  const [activeTab, setActiveTab] = useState('build');
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [atsChecking, setAtsChecking] = useState(false);
  const [jobOptimizing, setJobOptimizing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [atsResults, setAtsResults] = useState(null);
  const [showAtsModal, setShowAtsModal] = useState(false);
  const [jobOptResults, setJobOptResults] = useState(null);
  const [showJobOptModal, setShowJobOptModal] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    summary: ''
  });

  const [formData, setFormData] = useState({
    experience: [{ title: '', company: '', duration: '', description: '' }],
    education: [{ degree: '', institution: '', year: '', gpa: '' }],
    skills: '',
    projects: [{ title: '', description: '', link: '' }]
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [savedResume, setSavedResume] = useState(null);

  // Load existing resume on mount
  useEffect(() => {
    loadExistingResume();
  }, []);

  const loadExistingResume = async () => {
    try {
      const response = await api.get('/resume/my-resume');
      if (response.data.success && response.data.data) {
        const resume = response.data.data;
        setSavedResume(resume);
        
        // Populate form with existing data
        if (resume.content) {
          setFormData({
            experience: resume.content.experience?.length > 0 ? resume.content.experience : [{ title: '', company: '', duration: '', description: '' }],
            education: resume.content.education?.length > 0 ? resume.content.education : [{ degree: '', institution: '', year: '', gpa: '' }],
            skills: resume.content.skills?.join(', ') || '',
            projects: resume.content.projects?.length > 0 ? resume.content.projects : [{ title: '', description: '', link: '' }]
          });
        }
      }
    } catch (error) {
      // No existing resume found, that's okay
      console.log('No existing resume found');
    }
  };

  const handleInputChange = (section, index, field, value) => {
    const updatedSection = [...formData[section]];
    updatedSection[index][field] = value;
    setFormData({ ...formData, [section]: updatedSection });
  };

  const addField = (section, emptyTemplate) => {
    setFormData({
      ...formData,
      [section]: [...formData[section], emptyTemplate]
    });
  };

  const removeField = (section, index) => {
    const updatedSection = formData[section].filter((_, i) => i !== index);
    setFormData({ ...formData, [section]: updatedSection });
  };

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.url;
  };

  // New function: Generate resume using AI
  const handleAIGenerate = async () => {
    setAiGenerating(true);
    setMessage({ type: '', text: '' });

    try {
      // Prepare data for AI generation
      const aiPayload = {
        personalInfo: {
          name: personalInfo.name,
          email: personalInfo.email,
          phone: personalInfo.phone,
          linkedin: personalInfo.linkedin,
          summary: personalInfo.summary
        },
        experience: formData.experience.filter(exp => exp.title || exp.company),
        education: formData.education.filter(edu => edu.degree || edu.institution),
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean),
        projects: formData.projects.filter(proj => proj.title || proj.description)
      };

      // Validate minimum data
      if (!aiPayload.personalInfo.name && aiPayload.experience.length === 0 && aiPayload.education.length === 0) {
        setMessage({ 
          type: 'error', 
          text: 'Please provide at least your name, some experience, or education details for AI to generate a resume.' 
        });
        return;
      }

      const response = await api.post('/resume/generate', aiPayload);
      
      if (response.data.success) {
        // Update form with AI-generated content
        const generatedContent = response.data.data.content;
        setFormData({
          experience: generatedContent.experience?.length > 0 ? generatedContent.experience : formData.experience,
          education: generatedContent.education?.length > 0 ? generatedContent.education : formData.education,
          skills: generatedContent.skills?.join(', ') || formData.skills,
          projects: generatedContent.projects?.length > 0 ? generatedContent.projects : formData.projects
        });

        if (response.data.data.summary) {
          setPersonalInfo({ ...personalInfo, summary: response.data.data.summary });
        }

        setSavedResume(response.data.data);
        setMessage({ 
          type: 'success', 
          text: '✨ AI has enhanced your resume! Review and edit as needed.' 
        });
      }

    } catch (error) {
      console.error('AI Generation error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to generate resume. Please ensure MISTRAL_API_KEY is configured in backend.' 
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let payload = {};

      if (activeTab === 'upload') {
        if (!resumeFile) {
          throw new Error('Please select a file first.');
        }
        const fileUrl = await handleFileUpload(resumeFile);
        
        payload = {
          fileUrl,
          status: 'submitted'
        };
      } else {
        payload = {
          ...formData,
          skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean),
          status: 'submitted'
        };
      }

      await api.post('/resume', payload);
      
      setMessage({ type: 'success', text: 'Resume submitted successfully for review!' });
      loadExistingResume(); // Reload to get updated status
    } catch (error) {
      console.error('Resume submission error:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit resume.' });
    } finally {
      setLoading(false);
    }
  };

  // Save as draft without submitting
  const handleSaveDraft = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean),
        status: 'draft'
      };

      const response = await api.post('/resume', payload);
      setSavedResume(response.data.data);
      setMessage({ type: 'success', text: 'Resume saved as draft!' });
    } catch (error) {
      console.error('Save draft error:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save resume.' });
    } finally {
      setLoading(false);
    }
  };

  // Download resume as PDF
  const handleDownloadPDF = async () => {
    if (!savedResume || !savedResume._id) {
      setMessage({ type: 'error', text: 'Please save your resume first before downloading.' });
      return;
    }

    try {
      setMessage({ type: 'info', text: 'Generating PDF...' });
      
      const response = await api.get(`/resume/${savedResume._id}/download`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Resume_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'PDF downloaded successfully!' });
    } catch (error) {
      console.error('PDF download error:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to download PDF.' });
    }
  };

  // New function: Check ATS Compatibility
  const handleATSCheck = async () => {
    setAtsChecking(true);
    setMessage({ type: '', text: '' });

    try {
      // Prepare data for ATS check
      const atsPayload = {
        personalInfo: {
          name: personalInfo.name,
          email: personalInfo.email,
          phone: personalInfo.phone,
          linkedin: personalInfo.linkedin
        },
        summary: personalInfo.summary,
        content: {
          experience: formData.experience.filter(exp => exp.title || exp.company),
          education: formData.education.filter(edu => edu.degree || edu.institution),
          skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean),
          projects: formData.projects.filter(proj => proj.title || proj.description)
        }
      };

      // Validate minimum data
      if (atsPayload.content.experience.length === 0 && atsPayload.content.education.length === 0) {
        setMessage({ 
          type: 'error', 
          text: 'Please provide at least some experience or education details for ATS analysis.' 
        });
        return;
      }

      const response = await api.post('/resume/ats-check', atsPayload);
      
      if (response.data.success) {
        setAtsResults(response.data.data);
        setShowAtsModal(true);
        setMessage({ 
          type: 'success', 
          text: '✅ ATS compatibility check completed!' 
        });
      }

    } catch (error) {
      console.error('ATS check error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to complete ATS check. Please ensure MISTRAL_API_KEY is configured.' 
      });
    } finally {
      setAtsChecking(false);
    }
  };

  // New function: Optimize for Job Description
  const handleJobOptimization = async () => {
    if (!jobDescription || jobDescription.trim().length < 50) {
      setMessage({ 
        type: 'error', 
        text: 'Please provide a detailed job description (at least 50 characters).' 
      });
      return;
    }

    setJobOptimizing(true);
    setMessage({ type: '', text: '' });

    try {
      const optPayload = {
        personalInfo: {
          name: personalInfo.name,
          email: personalInfo.email,
          phone: personalInfo.phone,
          linkedin: personalInfo.linkedin
        },
        summary: personalInfo.summary,
        content: {
          experience: formData.experience.filter(exp => exp.title || exp.company),
          education: formData.education.filter(edu => edu.degree || edu.institution),
          skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean),
          projects: formData.projects.filter(proj => proj.title || proj.description)
        },
        jobDescription: jobDescription
      };

      if (optPayload.content.experience.length === 0 && optPayload.content.education.length === 0) {
        setMessage({ 
          type: 'error', 
          text: 'Please provide at least some experience or education details.' 
        });
        return;
      }

      const response = await api.post('/resume/optimize-for-job', optPayload);
      
      if (response.data.success) {
        setJobOptResults(response.data.data);
        setShowJobOptModal(true);
        setMessage({ 
          type: 'success', 
          text: `✅ Job match score: ${response.data.data.matchScore}%! Review optimization suggestions.` 
        });
      }

    } catch (error) {
      console.error('Job optimization error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to optimize for job description.' 
      });
    } finally {
      setJobOptimizing(false);
    }
  };

  // ATS Results Modal Component
  const ATSResultsModal = () => {
    if (!showAtsModal || !atsResults) return null;

    const getScoreColor = (score) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getScoreBgColor = (score) => {
      if (score >= 80) return 'bg-green-100';
      if (score >= 60) return 'bg-yellow-100';
      return 'bg-red-100';
    };

    const getRatingIcon = (rating) => {
      switch (rating) {
        case 'excellent': return <CheckCircle className="text-green-500" size={24} />;
        case 'good': return <CheckCircle className="text-blue-500" size={24} />;
        case 'fair': return <AlertTriangle className="text-yellow-500" size={24} />;
        case 'poor': return <AlertCircle className="text-red-500" size={24} />;
        default: return <Shield className="text-gray-500" size={24} />;
      }
    };

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'high': return 'bg-red-100 text-red-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="text-indigo-600" size={32} />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ATS Compatibility Report</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Applicant Tracking System Analysis</p>
                </div>
              </div>
              <button
                onClick={() => setShowAtsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Overall ATS Score</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{atsResults.summary}</p>
                </div>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(atsResults.overallScore)}`}>
                    {atsResults.overallScore}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">out of 100</div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {getRatingIcon(atsResults.atsRating)}
                    <span className="text-sm font-medium capitalize">{atsResults.atsRating}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Scores */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Category Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(atsResults.categories).map(([category, data]) => (
                  <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800 dark:text-white capitalize">{category}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreBgColor(data.score)} ${getScoreColor(data.score)}`}>
                        {data.score}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{data.feedback}</p>
                    {data.missingKeywords && data.missingKeywords.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Missing Keywords:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {data.missingKeywords.map((keyword, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths */}
            {atsResults.strengths && atsResults.strengths.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={20} />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {atsResults.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {atsResults.improvements && atsResults.improvements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="text-orange-500" size={20} />
                  Suggested Improvements
                </h3>
                <div className="space-y-3">
                  {atsResults.improvements.map((improvement, idx) => (
                    <div key={idx} className="border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-r">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 dark:text-white mb-1">{improvement.issue}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{improvement.suggestion}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getPriorityColor(improvement.priority)}`}>
                          {improvement.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={() => setShowAtsModal(false)}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Job Optimization Results Modal Component
  const JobOptimizationModal = () => {
    if (!showJobOptModal || !jobOptResults) return null;

    const getMatchColor = (score) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getMatchBgColor = (score) => {
      if (score >= 80) return 'bg-green-100';
      if (score >= 60) return 'bg-yellow-100';
      return 'bg-red-100';
    };

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'high': return 'bg-red-100 text-red-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="text-indigo-600" size={32} />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Job-Specific Optimization</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tailored recommendations for this position</p>
                </div>
              </div>
              <button
                onClick={() => setShowJobOptModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Match Score */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Job Match Score</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{jobOptResults.overallAssessment}</p>
                </div>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getMatchColor(jobOptResults.matchScore)}`}>
                    {jobOptResults.matchScore}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">match</div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <TrendingUp className={jobOptResults.matchScore >= 70 ? 'text-green-500' : 'text-orange-500'} size={20} />
                    <span className="text-sm font-medium">Est. Improvement: {jobOptResults.estimatedImprovement}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyword Analysis */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Target size={20} className="text-indigo-600" />
                Keyword Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matching Keywords */}
                <div className="border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} />
                    Matching Keywords ({jobOptResults.keywordAnalysis.matchingKeywords.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {jobOptResults.keywordAnalysis.matchingKeywords.map((keyword, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Missing Keywords ({jobOptResults.keywordAnalysis.missingKeywords.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {jobOptResults.keywordAnalysis.missingKeywords.map((keyword, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Keywords to Add */}
              {jobOptResults.keywordAnalysis.keywordsToAdd && jobOptResults.keywordAnalysis.keywordsToAdd.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-gray-800 dark:text-white">How to Add Missing Keywords:</h4>
                  {jobOptResults.keywordAnalysis.keywordsToAdd.map((item, idx) => (
                    <div key={idx} className="border-l-4 border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-r">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <span className="font-medium text-indigo-800 dark:text-indigo-300">{item.keyword}</span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.suggestion}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optimized Summary */}
            {jobOptResults.summaryOptimization && jobOptResults.summaryOptimization.optimizedSummary && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Optimized Professional Summary</h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <p className="text-gray-700 dark:text-gray-300 italic">"{jobOptResults.summaryOptimization.optimizedSummary}"</p>
                  {jobOptResults.summaryOptimization.keyPhrasesAdded && jobOptResults.summaryOptimization.keyPhrasesAdded.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Key phrases added:</p>
                      <div className="flex flex-wrap gap-1">
                        {jobOptResults.summaryOptimization.keyPhrasesAdded.map((phrase, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded">
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Experience Optimization */}
            {jobOptResults.experienceOptimization && jobOptResults.experienceOptimization.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Experience Optimization</h3>
                <div className="space-y-3">
                  {jobOptResults.experienceOptimization.map((exp, idx) => (
                    <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-800 dark:text-white">{exp.currentSection}</h4>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">needs update</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                        <strong>Issue:</strong> {exp.issue}
                      </p>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded p-3 mb-2">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Optimized version:</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{exp.optimizedVersion}</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <strong>Why:</strong> {exp.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Optimization */}
            {jobOptResults.skillsOptimization && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Skills Optimization</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {jobOptResults.skillsOptimization.skillsToHighlight && jobOptResults.skillsOptimization.skillsToHighlight.length > 0 && (
                    <div className="border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 text-sm">✨ Highlight These</h4>
                      <div className="flex flex-wrap gap-1">
                        {jobOptResults.skillsOptimization.skillsToHighlight.map((skill, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {jobOptResults.skillsOptimization.skillsToAdd && jobOptResults.skillsOptimization.skillsToAdd.length > 0 && (
                    <div className="border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 dark:text-green-300 mb-2 text-sm">➕ Add These</h4>
                      <div className="flex flex-wrap gap-1">
                        {jobOptResults.skillsOptimization.skillsToAdd.map((skill, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {jobOptResults.skillsOptimization.skillsToRemove && jobOptResults.skillsOptimization.skillsToRemove.length > 0 && (
                    <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 dark:text-gray-300 mb-2 text-sm">➖ Consider Removing</h4>
                      <div className="flex flex-wrap gap-1">
                        {jobOptResults.skillsOptimization.skillsToRemove.map((skill, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Items */}
            {jobOptResults.actionItems && jobOptResults.actionItems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="text-indigo-500" size={20} />
                  Action Items
                </h3>
                <div className="space-y-3">
                  {jobOptResults.actionItems.map((action, idx) => (
                    <div key={idx} className="border-l-4 border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-r">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-800 dark:text-white">{action.action}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(action.priority)}`}>
                              {action.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <strong>Impact:</strong> {action.impact}
                          </p>
                          {action.example && (
                            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2 mt-2">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Example:</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300 italic">{action.example}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ATS Compatibility for this Job */}
            {jobOptResults.atsCompatibility && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">ATS Compatibility for This Job</h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-700 dark:text-gray-300">Score for this specific role:</span>
                    <span className={`text-2xl font-bold ${getMatchColor(jobOptResults.atsCompatibility.score)}`}>
                      {jobOptResults.atsCompatibility.score}/100
                    </span>
                  </div>
                  {jobOptResults.atsCompatibility.recommendations && jobOptResults.atsCompatibility.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Recommendations:</p>
                      <ul className="space-y-1">
                        {jobOptResults.atsCompatibility.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-indigo-500 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={() => setShowJobOptModal(false)}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close Optimization Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-6">
      {/* ATS Results Modal */}
      <ATSResultsModal />
      
      {/* Job Optimization Modal */}
      <JobOptimizationModal />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Resume Builder</h1>
        {savedResume && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            savedResume.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
            savedResume.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {savedResume.status.charAt(0).toUpperCase() + savedResume.status.slice(1)}
          </span>
        )}
      </div>
      
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button 
          onClick={() => setActiveTab('build')} 
          className={`pb-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'build' 
              ? 'border-b-2 border-indigo-600 text-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Build from Scratch
        </button>
        <button 
          onClick={() => setActiveTab('upload')} 
          className={`pb-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'upload' 
              ? 'border-b-2 border-indigo-600 text-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Upload PDF
        </button>
      </div>

      {message.text && (
        <div className={`p-4 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {activeTab === 'build' ? (
          <div className="space-y-8">
            
            {/* AI Generation Section */}
            <section className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Sparkles className="text-purple-600" size={24} />
                    AI-Powered Resume Generation
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Fill in your basic details below, then let AI enhance and format your resume professionally
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAIGenerate}
                disabled={aiGenerating}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg"
              >
                <Sparkles size={20} />
                {aiGenerating ? 'Generating with AI...' : 'Generate Resume with AI'}
              </button>
            </section>

            {/* ATS Compatibility Check Section */}
            <section className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-700">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-2">
                  <Shield className="text-orange-600" size={24} />
                  ATS Compatibility Check
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Check if your resume is optimized for Applicant Tracking Systems used by employers
                </p>
              </div>
              
              <button
                type="button"
                onClick={handleATSCheck}
                disabled={atsChecking}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-yellow-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {atsChecking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Checking ATS Compatibility...
                  </>
                ) : (
                  <>
                    <Shield size={20} />
                    Check ATS Compatibility
                  </>
                )}
              </button>
            </section>

            {/* Personal Information */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={personalInfo.name}
                  onChange={(e) => setPersonalInfo({...personalInfo, name: e.target.value})}
                  className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={personalInfo.email}
                  onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                  className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                  className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="LinkedIn Profile URL"
                  value={personalInfo.linkedin}
                  onChange={(e) => setPersonalInfo({...personalInfo, linkedin: e.target.value})}
                  className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <textarea
                  placeholder="Professional Summary (optional - AI can generate this)"
                  value={personalInfo.summary}
                  onChange={(e) => setPersonalInfo({...personalInfo, summary: e.target.value})}
                  className="md:col-span-2 p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white h-20"
                />
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Experience</h2>
                <button 
                  type="button"
                  onClick={() => addField('experience', { title: '', company: '', duration: '', description: '' })}
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                >
                  <Plus size={16} className="mr-1" /> Add Experience
                </button>
              </div>
              {formData.experience.map((exp, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg mb-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={exp.title}
                      onChange={(e) => handleInputChange('experience', index, 'title', e.target.value)}
                      className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => handleInputChange('experience', index, 'company', e.target.value)}
                      className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Duration (e.g. Jan 2022 - Present)"
                    value={exp.duration}
                    onChange={(e) => handleInputChange('experience', index, 'duration', e.target.value)}
                    className="w-full p-2 mb-3 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <textarea
                    placeholder="Description of responsibilities"
                    value={exp.description}
                    onChange={(e) => handleInputChange('experience', index, 'description', e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white h-24"
                  />
                  {formData.experience.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeField('experience', index)}
                      className="mt-2 text-red-500 text-sm flex items-center hover:text-red-700"
                    >
                      <Trash2 size={14} className="mr-1" /> Remove
                    </button>
                  )}
                </div>
              ))}
            </section>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Education</h2>
                <button 
                  type="button"
                  onClick={() => addField('education', { degree: '', institution: '', year: '', gpa: '' })}
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                >
                  <Plus size={16} className="mr-1" /> Add Education
                </button>
              </div>
              {formData.education.map((edu, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg mb-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Degree / Course"
                      value={edu.degree}
                      onChange={(e) => handleInputChange('education', index, 'degree', e.target.value)}
                      className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Institution / College"
                      value={edu.institution}
                      onChange={(e) => handleInputChange('education', index, 'institution', e.target.value)}
                      className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Year of Completion"
                      value={edu.year}
                      onChange={(e) => handleInputChange('education', index, 'year', e.target.value)}
                      className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="GPA (optional)"
                      value={edu.gpa || ''}
                      onChange={(e) => handleInputChange('education', index, 'gpa', e.target.value)}
                      className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  {formData.education.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeField('education', index)}
                      className="mt-2 text-red-500 text-sm flex items-center hover:text-red-700"
                    >
                      <Trash2 size={14} className="mr-1" /> Remove
                    </button>
                  )}
                </div>
              ))}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Skills</h2>
              <textarea
                placeholder="Enter skills separated by commas (e.g. React, Node.js, Python, Leadership)"
                value={formData.skills}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500"
                rows="3"
              />
            </section>

            {/* Job Description Optimization Section */}
            <section className="p-6 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg border-2 border-green-200 dark:border-green-700">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-2">
                  <Target className="text-green-600" size={24} />
                  Job Description Optimization
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Paste a specific job description to get tailored optimization suggestions for that role
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Description
                  </label>
                  <textarea
                    placeholder="Paste the full job description here (minimum 50 characters)...&#10;&#10;Example:&#10;We are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud technologies. The ideal candidate will have strong problem-solving skills and experience with microservices architecture..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white min-h-[150px] resize-y focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {jobDescription.length} / 50 minimum characters
                    </p>
                    {jobDescription.length > 0 && jobDescription.length < 50 && (
                      <span className="text-xs text-orange-600 dark:text-orange-400">
                        ⚠ Need {50 - jobDescription.length} more characters
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleJobOptimization}
                  disabled={jobOptimizing || jobDescription.trim().length < 50}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {jobOptimizing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Optimizing for Job...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={20} />
                      Optimize Resume for This Job
                    </>
                  )}
                </button>
              </div>
            </section>

          </div>
        ) : (
          <div className="upload-section py-10 px-4 border-2 border-dashed border-gray-300 rounded-lg text-center dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files[0])}
              className="hidden"
            />
            <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
              <Upload size={48} className="text-gray-400 mb-4" />
              <span className="text-lg font-medium text-gray-700 dark:text-gray-200">
                {resumeFile ? resumeFile.name : 'Click to Upload Resume (PDF/DOC)'}
              </span>
              <span className="text-sm text-gray-500 mt-2">Maximum file size: 5MB</span>
            </label>
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          {activeTab === 'build' && (
            <>
              <button 
                type="button"
                onClick={handleSaveDraft}
                disabled={loading}
                className="flex items-center px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Save className="mr-2" size={18} />
                Save as Draft
              </button>
              
              <button 
                type="button"
                onClick={handleATSCheck}
                disabled={atsChecking}
                className="flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
                title="Check ATS Compatibility"
              >
                <Shield className="mr-2" size={18} />
                {atsChecking ? 'Checking ATS...' : 'Check ATS'}
              </button>
              
              <button 
                type="button"
                onClick={handleDownloadPDF}
                disabled={!savedResume}
                className="flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                title={!savedResume ? "Save your resume first to download PDF" : "Download as PDF"}
              >
                <Download className="mr-2" size={18} />
                Download PDF
              </button>
            </>
          )}
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? 'Submitting...' : (
              <>
                {activeTab === 'build' ? <Save className="mr-2" size={18} /> : <Upload className="mr-2" size={18} />}
                Submit for Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResumeBuilder;