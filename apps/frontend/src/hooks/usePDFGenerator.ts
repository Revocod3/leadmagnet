import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';
import { DiagnosticPDFTemplate } from '../components/pdf/DiagnosticPDFTemplate';

interface PDFOptions {
  userName: string;
  diagnosisContent: string;
  language?: 'es' | 'en';
}

export const usePDFGenerator = () => {
  const generatePDF = async ({ userName, diagnosisContent, language = 'es' }: PDFOptions) => {
    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      // Render the React component
      const root = createRoot(container);

      // Create a promise to wait for the component to render
      await new Promise<void>((resolve) => {
        root.render(
          DiagnosticPDFTemplate({ userName, diagnosisContent, language })
        );
        // Wait for next tick to ensure rendering is complete
        setTimeout(resolve, 100);
      });

      // Get the rendered element
      const element = container.querySelector('.pdf-container') as HTMLElement;
      if (!element) {
        throw new Error('PDF template not rendered correctly');
      }

      // Convert HTML to canvas with high quality
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // If content is longer than one page, add additional pages
      if (imgHeight > 297) { // A4 height in mm
        let remainingHeight = imgHeight - 297;
        let position = -297;

        while (remainingHeight > 0) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          position -= 297;
          remainingHeight -= 297;
        }
      }

      // Clean up
      root.unmount();
      document.body.removeChild(container);

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
