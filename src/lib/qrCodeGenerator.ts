import QRCode from 'qrcode';

/**
 * Standard RFC / ISO-18004 Compliant QR Code Generator
 * Powered by official 'qrcode' engine for instant, 100% reliable camera scanning on iOS and Android.
 */
export function generateQRCodeSVG(text: string, size: number = 250): string {
  try {
    if (!text || text.trim() === '') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#ffffff" /></svg>`;
    }

    // Generate standard QR matrix with Medium (15%) error correction
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const moduleCount = qr.modules.size;
    const margin = 4; // ISO/IEC 18004 Standard quiet zone (4 modules)
    const totalCount = moduleCount + margin * 2;

    // Build consolidated SVG path for maximum contrast, zero pixel gaps, and fastest browser rendering
    let path = '';
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) {
          path += `M${c + margin} ${r + margin}h1v1h-1z `;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalCount} ${totalCount}" width="${size}" height="${size}" shape-rendering="crispEdges">
      <rect width="100%" height="100%" fill="#ffffff" />
      <path d="${path.trim()}" fill="#000000" />
    </svg>`;
  } catch (err) {
    console.error('QR code generation failed:', err);
    return `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:12px;color:#dc2626;font-size:12px;font-weight:bold;text-align:center;padding:12px;">QR Kod Hatası</div>`;
  }
}

/**
 * Generate Base64 Data URL for QR Code
 */
export async function generateQRCodeDataURL(text: string, size: number = 250): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 4,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR data URL:', err);
    return '';
  }
}
