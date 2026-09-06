import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

/**
 * Exports an HTML container intelligently by breaking it down into blocks.
 * Uses html-to-image (which supports modern CSS like oklch) and jsPDF.
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

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  let currentY = margin;
  let pageCount = 1;

  // Find all elements marked as a block that shouldn't be cut
  const blocks = element.querySelectorAll<HTMLElement>('.pdf-block');

  if (!blocks || blocks.length === 0) {
    console.error("No .pdf-block elements found. Cannot generate paginated PDF.");
    return;
  }

  // Iterate over each block and render it as an image
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    // We add a tiny delay to ensure charting libraries and fonts are fully rendered
    await new Promise(r => setTimeout(r, 50));

    try {
      const dataUrl = await toPng(block, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      // Calculate heights
      const imgProps = pdf.getImageProperties(dataUrl);
      const blockPixelWidth = block.offsetWidth;
      const blockPixelHeight = block.offsetHeight;
      
      // Since we are capturing individual blocks inside a padded container,
      // the blocks themselves don't include the parent's padding in the image.
      // We want to stretch them to fill the PDF usable width entirely.
      const widthInMm = usableWidth;
      const heightInMm = (blockPixelHeight / blockPixelWidth) * widthInMm;

      // If the block is taller than a single page, we can't avoid cutting it, 
      // but if it fits and just exceeds current Y, add a page.
      if (currentY + heightInMm > usableHeight + margin) {
        // Only add page if we are not already at the top
        if (currentY > margin) {
            pdf.addPage('a4', 'portrait');
            pageCount++;
            currentY = margin;
        }
      }

      pdf.addImage(dataUrl, 'PNG', margin, currentY, widthInMm, heightInMm, undefined, 'FAST');
      currentY += heightInMm + 4; // Add 4mm spacing between blocks
      
    } catch (e) {
      console.warn("Could not render block to image", e);
    }
  }

  pdf.save(filename);
}
