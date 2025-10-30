import React from 'react';

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
      for: 'Para',
      date: 'Fecha',
      nextSteps: 'Próximos Pasos',
      disclaimer: 'Objetivo Vientre Plano',
      reminders: [
        'Este diagnóstico es una guía inicial basada en la información que compartiste.',
        'Los cambios reales requieren constancia, apoyo y un plan personalizado.',
        'Si quieres resultados duraderos, considera trabajar con un especialista.',
      ],
    },
    en: {
      title: 'Personalized Diagnosis',
      for: 'For',
      date: 'Date',
      nextSteps: 'Next Steps',
      disclaimer: 'Flat Belly Goal',
      reminders: [
        'This diagnosis is an initial guide based on the information you shared.',
        'Real changes require consistency, support, and a personalized plan.',
        'If you want lasting results, consider working with a specialist.',
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

  // Convert markdown-style content to HTML
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine === '') {
        return <div key={index} style={{ height: '0.5rem' }} />;
      }

      // Check for bold text (markdown format **text**)
      const boldMatch = trimmedLine.match(/^\*\*(.*?)\*\*$/);
      if (boldMatch && boldMatch[1]) {
        return (
          <h3 key={index} className="section-title">
            {boldMatch[1]}
          </h3>
        );
      }

      // Regular paragraph
      return (
        <p key={index} className="content-paragraph">
          {trimmedLine}
        </p>
      );
    });
  };

  return (
    <div className="pdf-container">
      <style>{`
        .pdf-container {
          width: 210mm;
          min-height: 297mm;
          background: white;
          padding: 20mm;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
          color: #2d2d2d;
          line-height: 1.6;
          position: relative;
        }

        .pdf-header {
          border-bottom: 3px solid #95C11F;
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
        }

        .pdf-title {
          font-size: 2rem;
          font-weight: 700;
          color: #222;
          margin: 0 0 0.75rem 0;
          letter-spacing: -0.02em;
        }

        .pdf-meta {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
        }

        .pdf-meta strong {
          color: #444;
          font-weight: 600;
        }

        .pdf-content {
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #222;
          margin: 1.75rem 0 0.75rem 0;
          line-height: 1.4;
        }

        .content-paragraph {
          font-size: 1rem;
          color: #444;
          margin: 0 0 0.75rem 0;
          line-height: 1.7;
          text-align: justify;
        }

        .pdf-next-steps {
          background: #f9faf8;
          border-left: 4px solid #95C11F;
          padding: 1.5rem;
          margin: 2rem 0;
          border-radius: 4px;
        }

        .next-steps-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #95C11F;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .next-steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .next-steps-item {
          font-size: 0.95rem;
          color: #555;
          margin-bottom: 0.75rem;
          padding-left: 1.5rem;
          position: relative;
          line-height: 1.6;
        }

        .next-steps-item:before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.5rem;
          width: 8px;
          height: 8px;
          background: #95C11F;
          border-radius: 50%;
        }

        .pdf-footer {
          position: absolute;
          bottom: 15mm;
          left: 20mm;
          right: 20mm;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
          font-size: 0.8rem;
          color: #999;
          text-align: center;
        }

        .pdf-footer strong {
          color: #95C11F;
          font-weight: 600;
        }

        @media print {
          .pdf-container {
            width: 100%;
            min-height: auto;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      <div className="pdf-header">
        <h1 className="pdf-title">{strings.title}</h1>
        <p className="pdf-meta">
          <strong>{strings.for}:</strong> {userName} &nbsp;|&nbsp; <strong>{strings.date}:</strong> {date}
        </p>
      </div>

      <div className="pdf-content">{formatContent(diagnosisContent)}</div>

      <div className="pdf-next-steps">
        <h2 className="next-steps-title">
          <span>🎯</span> {strings.nextSteps}
        </h2>
        <ul className="next-steps-list">
          {strings.reminders.map((reminder, index) => (
            <li key={index} className="next-steps-item">
              {reminder}
            </li>
          ))}
        </ul>
      </div>

      <div className="pdf-footer">
        © <strong>{strings.disclaimer}</strong> • {new Date().getFullYear()}
      </div>
    </div>
  );
};
