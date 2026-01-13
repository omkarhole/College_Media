const PDFDocument = require('pdfkit');

/**
 * PDF Service for Resume Generation
 * Creates professional PDF resumes with proper formatting
 */

class PDFService {
  /**
   * Generate PDF from resume data
   * @param {Object} resumeData - Resume content
   * @param {Object} userInfo - User information
   * @returns {PDFDocument} PDF document stream
   */
  generateResumePDF(resumeData, userInfo) {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Colors
    const primaryColor = '#2563eb'; // Blue
    const secondaryColor = '#64748b'; // Gray
    const textColor = '#1e293b'; // Dark gray

    // Header Section
    this.addHeader(doc, userInfo, primaryColor);
    
    // Summary Section
    if (resumeData.summary) {
      this.addSection(doc, 'Professional Summary', resumeData.summary, primaryColor, textColor);
    }

    // Experience Section
    if (resumeData.content?.experience?.length > 0) {
      this.addExperienceSection(doc, resumeData.content.experience, primaryColor, textColor, secondaryColor);
    }

    // Education Section
    if (resumeData.content?.education?.length > 0) {
      this.addEducationSection(doc, resumeData.content.education, primaryColor, textColor, secondaryColor);
    }

    // Skills Section
    if (resumeData.content?.skills?.length > 0) {
      this.addSkillsSection(doc, resumeData.content.skills, primaryColor, textColor);
    }

    // Projects Section
    if (resumeData.content?.projects?.length > 0) {
      this.addProjectsSection(doc, resumeData.content.projects, primaryColor, textColor, secondaryColor);
    }

    // Footer
    this.addFooter(doc, secondaryColor);

    return doc;
  }

  addHeader(doc, userInfo, primaryColor) {
    // Name
    doc.fontSize(24)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text(userInfo.firstName + ' ' + userInfo.lastName, { align: 'center' });

    doc.moveDown(0.3);

    // Contact Info
    doc.fontSize(10)
       .fillColor('#64748b')
       .font('Helvetica')
       .text([userInfo.email, userInfo.phone || '', userInfo.linkedin || ''].filter(Boolean).join(' • '), { align: 'center' });

    doc.moveDown(1.5);
    
    // Divider
    doc.moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .strokeColor(primaryColor)
       .lineWidth(2)
       .stroke();

    doc.moveDown(1);
  }

  addSection(doc, title, content, primaryColor, textColor) {
    // Section Title
    doc.fontSize(14)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text(title);

    doc.moveDown(0.5);

    // Content
    doc.fontSize(10)
       .fillColor(textColor)
       .font('Helvetica')
       .text(content, { align: 'justify', lineGap: 2 });

    doc.moveDown(1.5);
  }

  addExperienceSection(doc, experiences, primaryColor, textColor, secondaryColor) {
    doc.fontSize(14)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text('Professional Experience');

    doc.moveDown(0.5);

    experiences.forEach((exp, index) => {
      // Job Title
      doc.fontSize(12)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text(exp.title, { continued: true })
         .font('Helvetica')
         .fillColor(secondaryColor)
         .text(` at ${exp.company}`);

      // Duration
      doc.fontSize(9)
         .fillColor(secondaryColor)
         .font('Helvetica-Oblique')
         .text(exp.duration);

      doc.moveDown(0.3);

      // Description
      if (exp.description) {
        const descriptions = exp.description.split('\n').filter(d => d.trim());
        descriptions.forEach(desc => {
          doc.fontSize(10)
             .fillColor(textColor)
             .font('Helvetica')
             .text('• ' + desc.replace(/^•\s*/, ''), { indent: 10, lineGap: 2 });
        });
      }

      if (index < experiences.length - 1) {
        doc.moveDown(1);
      }
    });

    doc.moveDown(1.5);
  }

  addEducationSection(doc, education, primaryColor, textColor, secondaryColor) {
    doc.fontSize(14)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text('Education');

    doc.moveDown(0.5);

    education.forEach((edu, index) => {
      // Degree
      doc.fontSize(12)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text(edu.degree, { continued: true });

      // GPA
      if (edu.gpa) {
        doc.font('Helvetica')
           .fillColor(secondaryColor)
           .text(` | GPA: ${edu.gpa}`);
      } else {
        doc.text('');
      }

      // Institution and Year
      doc.fontSize(10)
         .fillColor(secondaryColor)
         .font('Helvetica')
         .text(`${edu.institution} | ${edu.year}`);

      if (index < education.length - 1) {
        doc.moveDown(0.8);
      }
    });

    doc.moveDown(1.5);
  }

  addSkillsSection(doc, skills, primaryColor, textColor) {
    doc.fontSize(14)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text('Skills');

    doc.moveDown(0.5);

    const skillText = skills.join(' • ');
    doc.fontSize(10)
       .fillColor(textColor)
       .font('Helvetica')
       .text(skillText, { lineGap: 2 });

    doc.moveDown(1.5);
  }

  addProjectsSection(doc, projects, primaryColor, textColor, secondaryColor) {
    doc.fontSize(14)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text('Projects');

    doc.moveDown(0.5);

    projects.forEach((proj, index) => {
      // Project Title
      doc.fontSize(12)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text(proj.title);

      // Link
      if (proj.link) {
        doc.fontSize(9)
           .fillColor('#2563eb')
           .font('Helvetica')
           .text(proj.link, { link: proj.link, underline: true });
      }

      doc.moveDown(0.3);

      // Description
      if (proj.description) {
        doc.fontSize(10)
           .fillColor(textColor)
           .font('Helvetica')
           .text(proj.description, { lineGap: 2 });
      }

      if (index < projects.length - 1) {
        doc.moveDown(1);
      }
    });

    doc.moveDown(1.5);
  }

  addFooter(doc, secondaryColor) {
    const footerY = 750;
    
    doc.fontSize(8)
       .fillColor(secondaryColor)
       .font('Helvetica-Oblique')
       .text(
         `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
         50,
         footerY,
         { align: 'center' }
       );
  }
}

module.exports = new PDFService();
