import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

/**
 * Exports an HTML container intelligently by breaking it down into blocks.
 * Uses html-to-image (which supports modern CSS like oklch) and jsPDF.
 * Supports blocks taller than one page by slicing them across pages.
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

  // Helper: load an image data URL into an HTMLImageElement
  function loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  // Helper: slice a portion of an image and return a data URL
  function sliceImage(
    img: HTMLImageElement,
    srcY: number,
    srcHeight: number,
    fullWidth: number
  ): string {
    const canvas = document.createElement('canvas');
    canvas.width = fullWidth;
    canvas.height = srcHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, srcY, fullWidth, srcHeight, 0, 0, fullWidth, srcHeight);
    return canvas.toDataURL('image/png');
  }

  // Iterate over each block and render it as an image
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    // We add a tiny delay to ensure charting libraries and fonts are fully rendered
    await new Promise(r => setTimeout(r, 50));

    try {
      const pixelRatio = 2;
      const dataUrl = await toPng(block, {
        quality: 0.98,
        pixelRatio,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      // Calculate dimensions
      const blockPixelWidth = block.offsetWidth;
      const blockPixelHeight = block.offsetHeight;
      
      const widthInMm = usableWidth;
      const heightInMm = (blockPixelHeight / blockPixelWidth) * widthInMm;

      // Case 1: the block fits within remaining space on current page
      if (currentY + heightInMm <= usableHeight + margin) {
        pdf.addImage(dataUrl, 'PNG', margin, currentY, widthInMm, heightInMm, undefined, 'FAST');
        currentY += heightInMm + 4;
      }
      // Case 2: the block fits within a single page, but not the current remaining space
      else if (heightInMm <= usableHeight) {
        pdf.addPage('a4', 'portrait');
        pageCount++;
        currentY = margin;
        pdf.addImage(dataUrl, 'PNG', margin, currentY, widthInMm, heightInMm, undefined, 'FAST');
        currentY += heightInMm + 4;
      }
      // Case 3: the block is TALLER than one full page — slice it across pages
      else {
        const img = await loadImage(dataUrl);
        const imgFullWidth = blockPixelWidth * pixelRatio;
        const imgFullHeight = blockPixelHeight * pixelRatio;
        // mm per pixel (in image pixel space)
        const mmPerPixel = widthInMm / imgFullWidth;

        let remainingImgY = 0; // current Y position in image pixels

        while (remainingImgY < imgFullHeight) {
          // How much vertical space is available on the current page (in mm)?
          const availableMm = usableHeight + margin - currentY;
          // Convert available mm to image pixels
          const availablePixels = Math.floor(availableMm / mmPerPixel);
          // How many pixels to render in this slice
          const slicePixels = Math.min(availablePixels, imgFullHeight - remainingImgY);
          const sliceHeightMm = slicePixels * mmPerPixel;

          if (slicePixels <= 0) {
            // No space left on this page, move to next
            pdf.addPage('a4', 'portrait');
            pageCount++;
            currentY = margin;
            continue;
          }

          const sliceDataUrl = sliceImage(img, remainingImgY, slicePixels, imgFullWidth);
          pdf.addImage(sliceDataUrl, 'PNG', margin, currentY, widthInMm, sliceHeightMm, undefined, 'FAST');

          remainingImgY += slicePixels;
          currentY += sliceHeightMm;

          // If there's more content, go to next page
          if (remainingImgY < imgFullHeight) {
            pdf.addPage('a4', 'portrait');
            pageCount++;
            currentY = margin;
          } else {
            currentY += 4; // spacing after block
          }
        }
      }
      
    } catch (e) {
      console.warn("Could not render block to image", e);
    }
  }

  pdf.save(filename);
}
