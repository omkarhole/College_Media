import { useState, useEffect } from 'react';
import api from '../services/api'; 
import { Plus, Trash2, Upload, Save, Sparkles, Download, Eye } from 'lucide-react';

const ResumeBuilder = () => {
  const [activeTab, setActiveTab] = useState('build');
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-6">
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