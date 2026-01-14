const axios = require('axios');

/**
 * AI Service for Resume Generation using Mistral AI
 * Generates professional resume content based on user inputs
 */

class AIService {
  constructor() {
    this.apiUrl = 'https://api.mistral.ai/v1/chat/completions';
    this.model = 'mistral-large-latest'; // Using the most capable model
  }

  getApiKey() {
    return process.env.MISTRAL_API_KEY;
  }

  /**
   * Generate resume content using AI
   * @param {Object} userData - User information for resume
   * @returns {Promise<Object>} Generated resume content
   */
  async generateResume(userData) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Mistral API key not configured. Please set MISTRAL_API_KEY in your environment variables.');
    }

    const { personalInfo, experience, education, skills, projects } = userData;

    const prompt = this.buildResumePrompt(personalInfo, experience, education, skills, projects);

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert resume writer and career counselor. Your job is to create professional, ATS-friendly resumes that highlight the candidate\'s strengths and achievements. Always use action verbs, quantify achievements when possible, and tailor content to be impactful and concise.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      const generatedContent = response.data.choices[0].message.content;
      return this.parseAIResponse(generatedContent, userData);

    } catch (error) {
      console.error('Mistral AI Error:', error.response?.data || error.message);
      throw new Error(`AI Resume Generation Failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Build a detailed prompt for the AI
   */
  buildResumePrompt(personalInfo, experience, education, skills, projects) {
    let prompt = `Generate a professional resume with the following information:\n\n`;

    // Personal Information
    if (personalInfo) {
      prompt += `PERSONAL INFORMATION:\n`;
      prompt += `Name: ${personalInfo.name || 'Not provided'}\n`;
      prompt += `Email: ${personalInfo.email || 'Not provided'}\n`;
      prompt += `Phone: ${personalInfo.phone || 'Not provided'}\n`;
      prompt += `LinkedIn: ${personalInfo.linkedin || 'Not provided'}\n`;
      prompt += `Summary: ${personalInfo.summary || 'Not provided'}\n\n`;
    }

    // Experience
    if (experience && experience.length > 0) {
      prompt += `EXPERIENCE:\n`;
      experience.forEach((exp, idx) => {
        prompt += `${idx + 1}. Title: ${exp.title || 'Not provided'}\n`;
        prompt += `   Company: ${exp.company || 'Not provided'}\n`;
        prompt += `   Duration: ${exp.duration || 'Not provided'}\n`;
        prompt += `   Description: ${exp.description || 'Not provided'}\n\n`;
      });
    }

    // Education
    if (education && education.length > 0) {
      prompt += `EDUCATION:\n`;
      education.forEach((edu, idx) => {
        prompt += `${idx + 1}. Degree: ${edu.degree || 'Not provided'}\n`;
        prompt += `   Institution: ${edu.institution || 'Not provided'}\n`;
        prompt += `   Year: ${edu.year || 'Not provided'}\n`;
        prompt += `   GPA: ${edu.gpa || 'Not provided'}\n\n`;
      });
    }

    // Skills
    if (skills && skills.length > 0) {
      prompt += `SKILLS:\n${skills.join(', ')}\n\n`;
    }

    // Projects
    if (projects && projects.length > 0) {
      prompt += `PROJECTS:\n`;
      projects.forEach((proj, idx) => {
        prompt += `${idx + 1}. Title: ${proj.title || 'Not provided'}\n`;
        prompt += `   Description: ${proj.description || 'Not provided'}\n`;
        prompt += `   Link: ${proj.link || 'Not provided'}\n\n`;
      });
    }

    prompt += `\nPlease enhance and rewrite this resume content to make it:\n`;
    prompt += `1. More professional and impactful\n`;
    prompt += `2. ATS-friendly with relevant keywords\n`;
    prompt += `3. Achievement-focused with quantifiable results where possible\n`;
    prompt += `4. Use strong action verbs\n`;
    prompt += `5. Concise yet comprehensive\n\n`;
    prompt += `Return the content in JSON format with the following structure:\n`;
    prompt += `{\n`;
    prompt += `  "experience": [{"title": "", "company": "", "duration": "", "description": ""}],\n`;
    prompt += `  "education": [{"degree": "", "institution": "", "year": "", "gpa": ""}],\n`;
    prompt += `  "skills": ["skill1", "skill2"],\n`;
    prompt += `  "projects": [{"title": "", "description": "", "link": ""}],\n`;
    prompt += `  "summary": "Professional summary (2-3 sentences)"\n`;
    prompt += `}\n`;

    return prompt;
  }

  /**
   * Parse AI response into structured resume data
   */
  parseAIResponse(content, originalData) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Normalize the experience descriptions (convert arrays to strings)
        const normalizedExperience = (parsed.experience || originalData.experience || []).map(exp => ({
          ...exp,
          description: Array.isArray(exp.description) 
            ? exp.description.join('\n• ') 
            : exp.description
        }));

        // Normalize project descriptions
        const normalizedProjects = (parsed.projects || originalData.projects || []).map(proj => ({
          ...proj,
          description: Array.isArray(proj.description)
            ? proj.description.join('\n• ')
            : proj.description
        }));

        return {
          experience: normalizedExperience,
          education: parsed.education || originalData.education || [],
          skills: parsed.skills || originalData.skills || [],
          projects: normalizedProjects,
          summary: parsed.summary || originalData.personalInfo?.summary || ''
        };
      }

      // If JSON parsing fails, return original data with enhancement note
      console.warn('Could not parse AI response as JSON, returning original data');
      return {
        experience: originalData.experience || [],
        education: originalData.education || [],
        skills: originalData.skills || [],
        projects: originalData.projects || [],
        summary: originalData.personalInfo?.summary || '',
        note: 'AI enhancement applied in text format'
      };

    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Return original data as fallback
      return {
        experience: originalData.experience || [],
        education: originalData.education || [],
        skills: originalData.skills || [],
        projects: originalData.projects || [],
        summary: originalData.personalInfo?.summary || ''
      };
    }
  }

  /**
   * Enhance specific sections of the resume
   */
  async enhanceSection(sectionType, content) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Mistral API key not configured');
    }

    let prompt = '';
    switch (sectionType) {
      case 'experience':
        prompt = `Rewrite this work experience description to be more impactful, professional, and ATS-friendly. Use action verbs and quantify achievements:\n\n${content}`;
        break;
      case 'summary':
        prompt = `Create a professional resume summary (2-3 sentences) based on this information:\n\n${content}`;
        break;
      case 'skills':
        prompt = `Organize and categorize these skills professionally:\n\n${content}`;
        break;
      default:
        throw new Error('Invalid section type');
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            { role: 'system', content: 'You are an expert resume writer.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('Mistral AI Error:', error.response?.data || error.message);
      throw new Error('AI Enhancement Failed');
    }
  }

  /**
   * Check ATS compatibility of resume
   * @param {Object} resumeData - Complete resume data
   * @returns {Promise<Object>} ATS analysis with score and suggestions
   */
  async checkATSCompatibility(resumeData) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Mistral API key not configured. Please set MISTRAL_API_KEY in your environment variables.');
    }

    const { content, summary, personalInfo } = resumeData;

    // Build comprehensive resume text for analysis
    let resumeText = '';
    
    if (personalInfo) {
      resumeText += `PERSONAL INFORMATION:\n`;
      resumeText += `${personalInfo.name || ''}\n`;
      resumeText += `${personalInfo.email || ''} | ${personalInfo.phone || ''}\n`;
      resumeText += `${personalInfo.linkedin || ''}\n\n`;
    }

    if (summary) {
      resumeText += `PROFESSIONAL SUMMARY:\n${summary}\n\n`;
    }

    if (content.experience && content.experience.length > 0) {
      resumeText += `EXPERIENCE:\n`;
      content.experience.forEach(exp => {
        resumeText += `${exp.title} at ${exp.company} (${exp.duration})\n`;
        resumeText += `${exp.description}\n\n`;
      });
    }

    if (content.education && content.education.length > 0) {
      resumeText += `EDUCATION:\n`;
      content.education.forEach(edu => {
        resumeText += `${edu.degree} - ${edu.institution} (${edu.year})`;
        if (edu.gpa) resumeText += ` - GPA: ${edu.gpa}`;
        resumeText += `\n`;
      });
      resumeText += `\n`;
    }

    if (content.skills && content.skills.length > 0) {
      resumeText += `SKILLS:\n${Array.isArray(content.skills) ? content.skills.join(', ') : content.skills}\n\n`;
    }

    if (content.projects && content.projects.length > 0) {
      resumeText += `PROJECTS:\n`;
      content.projects.forEach(proj => {
        resumeText += `${proj.title}\n${proj.description}\n`;
        if (proj.link) resumeText += `Link: ${proj.link}\n`;
        resumeText += `\n`;
      });
    }

    const prompt = `As an expert ATS (Applicant Tracking System) analyzer, evaluate this resume for ATS compatibility and provide detailed feedback.

RESUME TO ANALYZE:
${resumeText}

Please analyze and provide a JSON response with the following structure:
{
  "overallScore": <number 0-100>,
  "categories": {
    "formatting": {
      "score": <number 0-100>,
      "feedback": "<string>"
    },
    "keywords": {
      "score": <number 0-100>,
      "feedback": "<string>",
      "missingKeywords": ["<keyword1>", "<keyword2>"]
    },
    "content": {
      "score": <number 0-100>,
      "feedback": "<string>"
    },
    "structure": {
      "score": <number 0-100>,
      "feedback": "<string>"
    }
  },
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": [
    {
      "issue": "<issue description>",
      "suggestion": "<specific suggestion>",
      "priority": "<high|medium|low>"
    }
  ],
  "atsRating": "<excellent|good|fair|poor>",
  "summary": "<brief overall assessment>"
}

Evaluate based on:
1. Formatting: Simple, clean, ATS-friendly formatting without tables/graphics
2. Keywords: Industry-relevant keywords and action verbs
3. Content: Quantifiable achievements, clear descriptions
4. Structure: Proper sections, chronological order, consistency
5. Contact info, dates, and completeness

Be specific and actionable in your suggestions.`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert ATS (Applicant Tracking System) analyzer with deep knowledge of how recruiting software parses and ranks resumes. Provide detailed, actionable feedback to improve ATS compatibility.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      const atsAnalysis = response.data.choices[0].message.content;
      return this.parseATSResponse(atsAnalysis);

    } catch (error) {
      console.error('Mistral AI Error (ATS Check):', error.response?.data || error.message);
      throw new Error(`ATS Check Failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Parse ATS analysis response
   */
  parseATSResponse(content) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }

      // Fallback response if JSON parsing fails
      console.warn('Could not parse ATS response as JSON');
      return {
        overallScore: 0,
        categories: {
          formatting: { score: 0, feedback: 'Unable to analyze' },
          keywords: { score: 0, feedback: 'Unable to analyze', missingKeywords: [] },
          content: { score: 0, feedback: 'Unable to analyze' },
          structure: { score: 0, feedback: 'Unable to analyze' }
        },
        strengths: [],
        improvements: [{ issue: 'Analysis failed', suggestion: 'Please try again', priority: 'high' }],
        atsRating: 'unknown',
        summary: 'Unable to complete ATS analysis. Please try again.'
      };

    } catch (error) {
      console.error('Error parsing ATS response:', error);
      return {
        overallScore: 0,
        categories: {
          formatting: { score: 0, feedback: 'Error parsing response' },
          keywords: { score: 0, feedback: 'Error parsing response', missingKeywords: [] },
          content: { score: 0, feedback: 'Error parsing response' },
          structure: { score: 0, feedback: 'Error parsing response' }
        },
        strengths: [],
        improvements: [{ issue: 'Parsing error', suggestion: 'Please try again', priority: 'high' }],
        atsRating: 'unknown',
        summary: 'Error processing ATS analysis.'
      };
    }
  }

  /**
   * Optimize resume for specific job description
   * @param {Object} resumeData - Complete resume data
   * @param {String} jobDescription - Job description to optimize for
   * @returns {Promise<Object>} Optimized resume with job-specific suggestions
   */
  async optimizeForJobDescription(resumeData, jobDescription) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Mistral API key not configured. Please set MISTRAL_API_KEY in your environment variables.');
    }

    const { content, summary, personalInfo } = resumeData;

    // Build resume text
    let resumeText = '';
    
    if (personalInfo) {
      resumeText += `PERSONAL INFORMATION:\n`;
      resumeText += `${personalInfo.name || ''}\n`;
      resumeText += `${personalInfo.email || ''} | ${personalInfo.phone || ''}\n`;
      resumeText += `${personalInfo.linkedin || ''}\n\n`;
    }

    if (summary) {
      resumeText += `PROFESSIONAL SUMMARY:\n${summary}\n\n`;
    }

    if (content.experience && content.experience.length > 0) {
      resumeText += `EXPERIENCE:\n`;
      content.experience.forEach(exp => {
        resumeText += `${exp.title} at ${exp.company} (${exp.duration})\n`;
        resumeText += `${exp.description}\n\n`;
      });
    }

    if (content.education && content.education.length > 0) {
      resumeText += `EDUCATION:\n`;
      content.education.forEach(edu => {
        resumeText += `${edu.degree} - ${edu.institution} (${edu.year})`;
        if (edu.gpa) resumeText += ` - GPA: ${edu.gpa}`;
        resumeText += `\n`;
      });
      resumeText += `\n`;
    }

    if (content.skills && content.skills.length > 0) {
      resumeText += `SKILLS:\n${Array.isArray(content.skills) ? content.skills.join(', ') : content.skills}\n\n`;
    }

    if (content.projects && content.projects.length > 0) {
      resumeText += `PROJECTS:\n`;
      content.projects.forEach(proj => {
        resumeText += `${proj.title}\n${proj.description}\n`;
        if (proj.link) resumeText += `Link: ${proj.link}\n`;
        resumeText += `\n`;
      });
    }

    const prompt = `As an expert resume optimizer and ATS specialist, analyze this resume against the provided job description and provide specific optimization recommendations.

CURRENT RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

Provide a comprehensive analysis in JSON format:
{
  "matchScore": <number 0-100>,
  "overallAssessment": "<string>",
  "keywordAnalysis": {
    "matchingKeywords": ["<keyword1>", "<keyword2>"],
    "missingKeywords": ["<keyword1>", "<keyword2>"],
    "keywordsToAdd": [
      {
        "keyword": "<keyword>",
        "priority": "<high|medium|low>",
        "suggestion": "<where and how to add it>"
      }
    ]
  },
  "experienceOptimization": [
    {
      "currentSection": "<which experience section>",
      "issue": "<what's lacking>",
      "optimizedVersion": "<improved version with job-specific keywords>",
      "reasoning": "<why this change helps>"
    }
  ],
  "skillsOptimization": {
    "skillsToHighlight": ["<skill1>", "<skill2>"],
    "skillsToAdd": ["<skill1>", "<skill2>"],
    "skillsToRemove": ["<skill1>", "<skill2>"]
  },
  "summaryOptimization": {
    "currentIssues": ["<issue1>", "<issue2>"],
    "optimizedSummary": "<job-specific professional summary>",
    "keyPhrasesAdded": ["<phrase1>", "<phrase2>"]
  },
  "atsCompatibility": {
    "score": <number 0-100>,
    "issues": ["<issue1>", "<issue2>"],
    "recommendations": ["<recommendation1>", "<recommendation2>"]
  },
  "actionItems": [
    {
      "action": "<specific action>",
      "priority": "<high|medium|low>",
      "impact": "<expected impact>",
      "example": "<concrete example>"
    }
  ],
  "estimatedImprovement": "<expected improvement in ATS score>"
}

Focus on:
1. Exact keyword matches from job description
2. Required skills and qualifications alignment
3. Experience relevance to job requirements
4. ATS-friendly formatting for this specific role
5. Quantifiable achievements relevant to the position
6. Industry-specific terminology from the job posting

Be specific and actionable in all suggestions.`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert resume optimizer specializing in tailoring resumes to specific job descriptions while maintaining ATS compatibility. You provide detailed, actionable recommendations that significantly improve job match scores.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      const optimization = response.data.choices[0].message.content;
      return this.parseJobOptimizationResponse(optimization);

    } catch (error) {
      console.error('Mistral AI Error (Job Optimization):', error.response?.data || error.message);
      throw new Error(`Job Optimization Failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Parse job optimization response
   */
  parseJobOptimizationResponse(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }

      console.warn('Could not parse job optimization response as JSON');
      return {
        matchScore: 0,
        overallAssessment: 'Unable to complete analysis. Please try again.',
        keywordAnalysis: {
          matchingKeywords: [],
          missingKeywords: [],
          keywordsToAdd: []
        },
        experienceOptimization: [],
        skillsOptimization: {
          skillsToHighlight: [],
          skillsToAdd: [],
          skillsToRemove: []
        },
        summaryOptimization: {
          currentIssues: [],
          optimizedSummary: '',
          keyPhrasesAdded: []
        },
        atsCompatibility: {
          score: 0,
          issues: [],
          recommendations: []
        },
        actionItems: [],
        estimatedImprovement: 'Unknown'
      };

    } catch (error) {
      console.error('Error parsing job optimization response:', error);
      return {
        matchScore: 0,
        overallAssessment: 'Error processing analysis.',
        keywordAnalysis: {
          matchingKeywords: [],
          missingKeywords: [],
          keywordsToAdd: []
        },
        experienceOptimization: [],
        skillsOptimization: {
          skillsToHighlight: [],
          skillsToAdd: [],
          skillsToRemove: []
        },
        summaryOptimization: {
          currentIssues: [],
          optimizedSummary: '',
          keyPhrasesAdded: []
        },
        atsCompatibility: {
          score: 0,
          issues: [],
          recommendations: []
        },
        actionItems: [],
        estimatedImprovement: 'Unknown'
      };
    }
  }
}

module.exports = new AIService();
