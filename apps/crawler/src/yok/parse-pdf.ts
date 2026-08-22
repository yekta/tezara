const BASE = "https://tez.yok.gov.tr/UlusalTezMerkezi/";

export type PdfInfo = { pdf_url: string | null; restricted: boolean };

/**
 * getTezPdf.jsp returns a small fragment: either a TezGoster link, or an info icon when
 * no full text is available. Keys are stable — 294/294 matched URLs crawled a year ago.
 * EkGoster supplement links are deliberately ignored.
 */
export function parsePdfFragment(html: string): PdfInfo {
  if (!html) return { pdf_url: null, restricted: false };
  const m = /href=['"](TezGoster\?key=[^'"]+)['"]/.exec(html);
  if (m) return { pdf_url: BASE + m[1], restricted: false };
  return { pdf_url: null, restricted: /pdf-info-icon|togglePdfMsg/.test(html) };
}
