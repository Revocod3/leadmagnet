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
      // Create a temporary container off-screen
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm'; // A4 width
      document.body.appendChild(container);

      // Render the React component
      const root = createRoot(container);

      // Wait for component to render
      await new Promise<void>((resolve) => {
        root.render(
          DiagnosticPDFTemplate({ userName, diagnosisContent, language })
        );
        // Wait a bit longer for images and styles to load
        setTimeout(resolve, 500);
      });

      // Get the rendered element
      const element = container.querySelector('.pdf-container') as HTMLElement;
      if (!element) {
        throw new Error('PDF template not rendered correctly');
      }

      // Convert HTML to canvas with high quality settings
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, // A4 width in pixels at 96dpi
        windowHeight: 1123, // A4 height in pixels at 96dpi
        onclone: (clonedDoc) => {
          // Ensure styles are applied to cloned document
          const clonedElement = clonedDoc.querySelector('.pdf-container') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.width = '210mm';
            clonedElement.style.minHeight = '297mm';
          }
        }
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add metadata to PDF
      pdf.setProperties({
        title: `Diagnóstico - ${userName}`,
        subject: 'Diagnóstico Personalizado - Objetivo Vientre Plano',
        author: 'Objetivo Vientre Plano',
        keywords: 'diagnóstico, salud digestiva, bienestar',
        creator: 'OVP Diagnostic System'
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/jpeg', 0.95); // Use JPEG for smaller file size

      // Handle multi-page documents
      let heightLeft = imgHeight;
      let position = 0;
      let pageNum = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pageNum++;

        // Add page number
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text(
          `Página ${pageNum + 1}`,
          105, // Center of page
          290, // Near bottom
          { align: 'center' }
        );

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Clean up
      root.unmount();
      document.body.removeChild(container);

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const safeUserName = userName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `diagnostico_ovp_${safeUserName}_${dateStr}.pdf`;

      // Save PDF
      pdf.save(filename);

      // Return success
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);

      // Try to clean up if there was an error
      const container = document.querySelector('div[style*="-9999px"]');
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }

      return false;
    }
  };

  const generatePDFBlob = async ({ userName, diagnosisContent, language = 'es' }: PDFOptions): Promise<Blob | null> => {
    try {
      // Similar to generatePDF but returns a Blob instead of downloading
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm';
      document.body.appendChild(container);

      const root = createRoot(container);

      await new Promise<void>((resolve) => {
        root.render(
          DiagnosticPDFTemplate({ userName, diagnosisContent, language })
        );
        setTimeout(resolve, 500);
      });

      const element = container.querySelector('.pdf-container') as HTMLElement;
      if (!element) {
        throw new Error('PDF template not rendered correctly');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        windowHeight: 1123,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      pdf.setProperties({
        title: `Diagnóstico - ${userName}`,
        subject: 'Diagnóstico Personalizado - Objetivo Vientre Plano',
        author: 'Objetivo Vientre Plano',
        keywords: 'diagnóstico, salud digestiva, bienestar',
        creator: 'OVP Diagnostic System'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Clean up
      root.unmount();
      document.body.removeChild(container);

      // Return as Blob
      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF blob:', error);

      const container = document.querySelector('div[style*="-9999px"]');
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }

      return null;
    }
  };

  return { generatePDF, generatePDFBlob };
};
