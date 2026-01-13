/**
 * Test script for Resume AI Service
 * This script tests the AI resume generation functionality
 * 
 * Usage: node testAI.js
 */

require('dotenv').config();
const aiService = require('./services/aiService');

const testData = {
  personalInfo: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    linkedin: 'linkedin.com/in/johndoe',
    summary: 'Passionate software developer with 2 years of experience'
  },
  experience: [
    {
      title: 'Junior Software Developer',
      company: 'Tech Solutions Inc',
      duration: 'Jan 2022 - Present',
      description: 'Developed web applications using React and Node.js. Worked on multiple projects.'
    }
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'State University',
      year: '2021',
      gpa: '3.8'
    }
  ],
  skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Git'],
  projects: [
    {
      title: 'E-commerce Platform',
      description: 'Built a full-stack e-commerce application',
      link: 'github.com/johndoe/ecommerce'
    }
  ]
};

async function testAIService() {
  console.log('🧪 Testing AI Resume Generation Service...\n');
  
  // Check if API key is configured
  if (!process.env.MISTRAL_API_KEY) {
    console.error('❌ ERROR: MISTRAL_API_KEY not found in .env file');
    console.log('\n📝 Please add your Mistral API key to backend/.env:');
    console.log('   MISTRAL_API_KEY=your_api_key_here\n');
    console.log('🔗 Get your API key from: https://console.mistral.ai/\n');
    process.exit(1);
  }

  console.log('✅ API Key found\n');
  console.log('📤 Sending test data to Mistral AI...\n');
  console.log('Test Data:', JSON.stringify(testData, null, 2));
  console.log('\n⏳ Generating resume (this may take 5-10 seconds)...\n');

  try {
    const result = await aiService.generateResume(testData);
    
    console.log('✅ SUCCESS! AI Resume Generated\n');
    console.log('=' .repeat(60));
    console.log('GENERATED RESUME CONTENT');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log(result.summary || 'N/A');
    
    console.log('\n💼 Experience:');
    result.experience.forEach((exp, idx) => {
      console.log(`\n${idx + 1}. ${exp.title} at ${exp.company}`);
      console.log(`   ${exp.duration}`);
      console.log(`   ${exp.description}`);
    });
    
    console.log('\n🎓 Education:');
    result.education.forEach((edu, idx) => {
      console.log(`${idx + 1}. ${edu.degree} - ${edu.institution} (${edu.year})`);
    });
    
    console.log('\n🛠️  Skills:');
    console.log(result.skills.join(', '));
    
    if (result.projects && result.projects.length > 0) {
      console.log('\n🚀 Projects:');
      result.projects.forEach((proj, idx) => {
        console.log(`${idx + 1}. ${proj.title}: ${proj.description}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed successfully!');
    console.log('🎉 AI service is working correctly\n');
    
  } catch (error) {
    console.error('\n❌ ERROR: AI Generation Failed\n');
    console.error('Error Message:', error.message);
    console.error('\nPossible causes:');
    console.error('1. Invalid API key');
    console.error('2. No API credits remaining');
    console.error('3. Network connectivity issues');
    console.error('4. API service is down');
    console.error('\n💡 Check your Mistral AI console: https://console.mistral.ai/\n');
  }
}

// Run the test
testAIService();
