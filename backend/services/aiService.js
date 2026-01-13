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
}

module.exports = new AIService();
