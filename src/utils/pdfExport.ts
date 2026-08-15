import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

/**
 * Exports one or more HTML A4 pages or a continuous element to a high-resolution PDF.
 * @param element The container element containing .pdf-page elements or the entire printable document
 * @param filename Desired filename for the download
 */
export async function exportHtmlToPdf(
  element: HTMLElement,
  filename: string = 'informe_evaluacion.pdf'
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  // Query individual A4 pages inside the container if present
  const pages = element.querySelectorAll<HTMLElement>('.pdf-page');

  if (pages && pages.length > 0) {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const dataUrl = await toPng(page, {
        quality: 0.98,
        pixelRatio: 2, // High DPI for crisp text and graphics
        backgroundColor: '#ffffff',
        cacheBust: true
      });

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
    }
  } else {
    // Single container fallback
    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const imgHeight = (element.offsetHeight * pageWidth) / element.offsetWidth;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(dataUrl, 'PNG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 5) {
      position -= pageHeight;
      pdf.addPage('a4', 'portrait');
      pdf.addImage(dataUrl, 'PNG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }
  }

  pdf.save(filename);
}
