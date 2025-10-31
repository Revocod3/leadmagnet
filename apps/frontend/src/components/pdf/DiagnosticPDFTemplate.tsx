import React from 'react';
import ReactMarkdown from 'react-markdown';

interface DiagnosticPDFTemplateProps {
  userName: string;
  diagnosisContent: string;
  language?: 'es' | 'en';
}

export const DiagnosticPDFTemplate: React.FC<DiagnosticPDFTemplateProps> = ({
  userName,
  diagnosisContent,
  language = 'es',
}) => {
  const content = {
    es: {
      title: 'Diagnóstico Personalizado',
      subtitle: 'Método Objetivo Vientre Plano',
      for: 'Para',
      date: 'Fecha',
      professional: 'Clara - Especialista en Salud Digestiva',
      nextSteps: 'Plan de Acción Recomendado',
      copyright: '© Objetivo Vientre Plano',
      website: 'objetivovientreplano.com',
      recommendations: [
        'Accede a nuestro chat avanzado con seguimiento personalizado 24/7',
        'Plan alimentario adaptado a tus necesidades específicas',
        'Programa completo de ejercicios y técnicas de relajación',
        'Soporte continuo y resultados medibles en tu transformación',
      ],
    },
    en: {
      title: 'Personalized Diagnosis',
      subtitle: 'Flat Belly Goal Method',
      for: 'For',
      date: 'Date',
      professional: 'Clara - Digestive Health Specialist',
      nextSteps: 'Recommended Action Plan',
      copyright: '© Flat Belly Goal',
      website: 'objetivovientreplano.com',
      recommendations: [
        'Access our advanced chat with personalized 24/7 follow-up',
        'Meal plan adapted to your specific needs',
        'Complete exercise program and relaxation techniques',
        'Continuous support and measurable results in your transformation',
      ],
    },
  };

  const strings = content[language];
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  const date = new Date().toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Decode HTML entities
  const decodeHtmlEntities = (text: string): string => {
    const entities: Record<string, string> = {
      '&nbsp;': ' ',
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&mdash;': '—',
      '&ndash;': '–',
      '&hellip;': '...',
      '&ldquo;': '"',
      '&rdquo;': '"',
      '&lsquo;': "'",
      '&rsquo;': "'",
      '&bull;': '•',
      '&deg;': '°',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™',
    };

    let decoded = text;

    // Replace common named entities
    Object.keys(entities).forEach(entity => {
      const replacement = entities[entity];
      if (replacement !== undefined) {
        const regex = new RegExp(entity, 'g');
        decoded = decoded.replace(regex, replacement);
      }
    });

    // Replace numeric entities (e.g., &#123; or &#x7B;)
    decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    return decoded;
  };

  // Remove HTML tags but preserve content
  const stripHtmlTags = (text: string): string => {
    return text.replace(/<[^>]+>/g, '');
  };

  // Process markdown content to clean it up
  const processMarkdownContent = (text: string) => {
    // First decode HTML entities
    let processed = decodeHtmlEntities(text);

    // Strip HTML tags (like <strong>, <em>, etc.)
    processed = stripHtmlTags(processed);

    // Remove ### and replace with proper headers
    processed = processed.replace(/^###\s+(.+)$/gm, '## $1');

    // Clean up excessive line breaks
    processed = processed.replace(/\n{3,}/g, '\n\n');

    // Ensure proper spacing around headers
    processed = processed.replace(/(\n|^)(#{1,3}\s+[^\n]+)(\n|$)/g, '\n\n$2\n\n');

    return processed;
  };

  const cleanedContent = processMarkdownContent(diagnosisContent);

  return (
    <div className="pdf-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        
        .pdf-container {
          width: 210mm;
          min-height: 297mm;
          background: white;
          padding: 0;
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', 'Arial', sans-serif;
          color: #2d2d2d;
          line-height: 1.6;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        /* Page break handling */
        @media print {
          .pdf-container {
            page-break-after: always;
          }
          .avoid-page-break {
            page-break-inside: avoid;
          }
        }

        /* Header Section */
        .pdf-header {
          background: linear-gradient(135deg, #99AB75 0%, #A0AD5E 50%, #A5B26C 100%);
          padding: 2rem 2.5rem;
          color: white;
          margin: 0;
          page-break-after: avoid;
          page-break-inside: avoid;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .logo-container {
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .logo-image {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
        }

        .brand-info {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .brand-subtitle {
          font-size: 0.85rem;
          opacity: 0.95;
          margin: 0;
        }

        .pdf-title {
          font-size: 2.2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }

        .pdf-meta {
          display: flex;
          gap: 2rem;
          font-size: 0.95rem;
          opacity: 0.95;
        }

        .pdf-meta-item {
          display: flex;
          gap: 0.5rem;
        }

        .pdf-meta-label {
          font-weight: 600;
        }

        /* Content Section */
        .pdf-body {
          flex: 1;
          padding: 2.5rem;
          page-break-before: avoid;
        }

        .pdf-content {
          margin-bottom: 2rem;
          page-break-inside: auto;
        }

        /* Markdown Styles */
        .markdown-content h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #222;
          margin: 2rem 0 1rem 0;
          page-break-after: avoid;
          page-break-inside: avoid;
          page-break-before: auto;
          border-bottom: 3px solid #95C11F;
          padding-bottom: 0.5rem;
          orphans: 3;
          widows: 3;
        }

        .markdown-content h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #333;
          margin: 1.75rem 0 0.75rem 0;
          page-break-after: avoid;
          page-break-inside: avoid;
          page-break-before: auto;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          orphans: 3;
          widows: 3;
        }

        .markdown-content h2::before {
          content: '';
          width: 4px;
          height: 1.2em;
          background: #95C11F;
          border-radius: 2px;
        }

        .markdown-content h3 {
          font-size: 1.15rem;
          font-weight: 600;
          color: #444;
          margin: 1.5rem 0 0.75rem 0;
          page-break-after: avoid;
          page-break-inside: avoid;
          page-break-before: auto;
          orphans: 3;
          widows: 3;
        }

        .markdown-content p {
          font-size: 1rem;
          color: #444;
          margin: 0 0 1rem 0;
          line-height: 1.7;
          text-align: justify;
          hyphens: auto;
          page-break-inside: avoid;
          orphans: 3;
          widows: 3;
        }

        .markdown-content strong {
          font-weight: 600;
          color: #222;
        }

        .markdown-content em {
          font-style: italic;
          color: #555;
        }

        .markdown-content ul, .markdown-content ol {
          margin: 0.75rem 0 0.75rem 1.5rem;
          padding: 0;
          page-break-inside: avoid;
          orphans: 3;
          widows: 3;
        }

        .markdown-content li {
          font-size: 1rem;
          color: #444;
          margin-bottom: 0.5rem;
          line-height: 1.6;
          page-break-inside: avoid;
        }

        .markdown-content ul li::marker {
          color: #95C11F;
        }

        .markdown-content blockquote {
          border-left: 4px solid #95C11F;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #555;
          page-break-inside: avoid;
          orphans: 3;
          widows: 3;
        }

        .markdown-content a {
          color: #95C11F;
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid #95C11F;
        }

        /* Next Steps Section */
        .pdf-next-steps {
          background: linear-gradient(to right, #f8faf6, #f3f7f0);
          border-left: 4px solid #95C11F;
          padding: 1.75rem;
          margin: 2rem 0;
          border-radius: 8px;
          page-break-inside: avoid;
        }

        .next-steps-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #222;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .next-steps-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: #95C11F;
          color: white;
          border-radius: 50%;
          font-size: 1.1rem;
        }

        .next-steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .next-steps-item {
          font-size: 0.95rem;
          color: #555;
          margin-bottom: 0.85rem;
          padding-left: 2rem;
          position: relative;
          line-height: 1.6;
        }

        .next-steps-item:before {
          content: '✓';
          position: absolute;
          left: 0;
          top: 0;
          width: 20px;
          height: 20px;
          background: #95C11F;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
        }

        /* Footer */
        .pdf-footer {
          background: #f9f9f9;
          border-top: 2px solid #e0e0e0;
          padding: 1.5rem 2.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: #666;
          page-break-inside: avoid;
          margin-top: auto;
        }

        .footer-left {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .footer-brand {
          font-weight: 600;
          color: #95C11F;
        }

        .footer-right {
          text-align: right;
        }

        .footer-website {
          color: #95C11F;
          text-decoration: none;
          font-weight: 500;
        }

        /* Call to Action Box */
        .cta-box {
          background: linear-gradient(135deg, #99AB75 0%, #A0AD5E 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 12px;
          margin: 2rem 0;
          text-align: center;
          page-break-inside: avoid;
        }

        .cta-title {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
        }

        .cta-text {
          font-size: 0.95rem;
          margin: 0 0 1rem 0;
          opacity: 0.95;
        }

        .cta-button {
          display: inline-block;
          background: white;
          color: #95C11F;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1rem;
        }
      `}</style>

      {/* Header Section */}
      <div className="pdf-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-container">
              <img
                src="/assets/images/favicon.webp"
                alt="OVP"
                className="logo-image"
                onError={(e) => {
                  // Fallback if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div style="font-size: 24px; font-weight: bold; color: #95C11F;">OVP</div>';
                }}
              />
            </div>
            <div className="brand-info">
              <h3 className="brand-title">{strings.subtitle}</h3>
              <p className="brand-subtitle">{strings.professional}</p>
            </div>
          </div>
        </div>
        <h1 className="pdf-title">{strings.title}</h1>
        <div className="pdf-meta">
          <div className="pdf-meta-item">
            <span className="pdf-meta-label">{strings.for}:</span>
            <span>{userName}</span>
          </div>
          <div className="pdf-meta-item">
            <span className="pdf-meta-label">{strings.date}:</span>
            <span>{date}</span>
          </div>
        </div>
      </div>

      {/* Body Section */}
      <div className="pdf-body">
        {/* Main Content with Markdown */}
        <div className="pdf-content markdown-content">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="avoid-page-break">{children}</h1>,
              h2: ({ children }) => <h2 className="avoid-page-break">{children}</h2>,
              h3: ({ children }) => <h3 className="avoid-page-break">{children}</h3>,
              p: ({ children }) => <p>{children}</p>,
              ul: ({ children }) => <ul className="avoid-page-break">{children}</ul>,
              ol: ({ children }) => <ol className="avoid-page-break">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              strong: ({ children }) => <strong>{children}</strong>,
              em: ({ children }) => <em>{children}</em>,
              blockquote: ({ children }) => <blockquote className="avoid-page-break">{children}</blockquote>,
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {cleanedContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* Footer */}
      <div className="pdf-footer">
        <div className="footer-left">
          <span className="footer-brand">{strings.copyright} • {new Date().getFullYear()}</span>
          <span>Todos los derechos reservados</span>
        </div>
        <div className="footer-right">
          <a href={`https://${strings.website}`} className="footer-website">
            {strings.website}
          </a>
        </div>
      </div>
    </div>
  );
};
