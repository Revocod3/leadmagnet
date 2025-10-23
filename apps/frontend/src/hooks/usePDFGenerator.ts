import { jsPDF } from 'jspdf';

interface PDFOptions {
  userName: string;
  diagnosisContent: string;
  language?: 'es' | 'en';
}

export const usePDFGenerator = () => {
  const generatePDF = ({ userName, diagnosisContent, language = 'es' }: PDFOptions) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');

      const content = {
        es: {
          title: 'Diagnóstico Personalizado',
          for: 'Para',
          date: 'Fecha',
          nextSteps: '🎯 Próximos Pasos',
          page: 'Página',
          of: 'de',
          disclaimer: '© Objetivo Vientre Plano',
          reminders: [
            '✅ Este diagnóstico es una guía inicial basada en la información que compartiste.',
            '💪 Los cambios reales requieren constancia, apoyo y un plan personalizado.',
            '🌟 Si quieres resultados duraderos, considera trabajar con un especialista.',
          ],
        },
        en: {
          title: 'Personalized Diagnosis',
          for: 'For',
          date: 'Date',
          nextSteps: '🎯 Next Steps',
          page: 'Page',
          of: 'of',
          disclaimer: '© Flat Belly Goal',
          reminders: [
            '✅ This diagnosis is an initial guide based on the information you shared.',
            '💪 Real changes require consistency, support, and a personalized plan.',
            '🌟 If you want lasting results, consider working with a specialist.',
          ],
        },
      };

      const strings = content[language];
      const locale = language === 'es' ? 'es-ES' : 'en-US';

      // Constants
      const MARGIN = 20;
      const PAGE_WIDTH = pdf.internal.pageSize.getWidth();
      const PAGE_HEIGHT = pdf.internal.pageSize.getHeight();
      const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
      const BRAND_COLOR: [number, number, number] = [149, 193, 31]; // #95C11F
      let y = MARGIN;

      // Helper function to check page break
      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > PAGE_HEIGHT - MARGIN) {
          pdf.addPage();
          y = MARGIN;
        }
      };

      // Header with brand color line
      y += 10;
      pdf.setDrawColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
      pdf.setLineWidth(0.5);
      pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
      y += 15;

      // Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(34, 34, 34);
      pdf.text(strings.title, MARGIN, y);
      y += 10;

      // User info and date
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(100, 100, 100);
      const date = new Date().toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      pdf.text(`${strings.for}: ${userName} | ${strings.date}: ${date}`, MARGIN, y);
      y += 15;

      // Diagnosis content
      const lines = diagnosisContent.split('\n');
      pdf.setTextColor(50, 50, 50);

      lines.forEach((line) => {
        line = line.trim();

        if (line === '') {
          y += 3;
          return;
        }

        checkPageBreak(7);

        // Check for bold text (markdown format **text**)
        const boldMatch = line.match(/^\*\*(.*?)\*\*/);

        if (boldMatch && boldMatch[1]) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          const titleText = boldMatch[1].trim();
          pdf.text(titleText, MARGIN, y);
          y += 8;
        } else {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(11);
          const paragraphLines = pdf.splitTextToSize(line, CONTENT_WIDTH);
          paragraphLines.forEach((pLine: string) => {
            checkPageBreak(7);
            pdf.text(pLine, MARGIN, y);
            y += 7;
          });
        }
      });

      // Next steps section
      y += 15;
      checkPageBreak(60);
      pdf.setDrawColor(220, 220, 220);
      pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
      y += 12;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
      pdf.text(strings.nextSteps, MARGIN, y);
      y += 10;

      // Reminders
      pdf.setFont('helvetica', 'normal');
      strings.reminders.forEach((reminder) => {
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.setFillColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
        const reminderLines = pdf.splitTextToSize(reminder, CONTENT_WIDTH - 5);
        checkPageBreak(reminderLines.length * 5 + 7);
        pdf.circle(MARGIN, y - 1.5, 1.2, 'F');
        pdf.text(reminderLines, MARGIN + 5, y);
        y += reminderLines.length * 5 + 7;
      });

      // Footer with page numbers
      const totalPages = (pdf.internal.pages?.length || 1) - 1; // Subtract the first empty page
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `${strings.page} ${i} ${strings.of} ${totalPages}`,
          PAGE_WIDTH / 2,
          PAGE_HEIGHT - 10,
          { align: 'center' }
        );
        pdf.text(strings.disclaimer, MARGIN, PAGE_HEIGHT - 10);
      }

      // Save PDF
      const safeUserName = userName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      pdf.save(`diagnostico-objetivo-vientre-plano-${safeUserName}.pdf`);

      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return false;
    }
  };

  return { generatePDF };
};
