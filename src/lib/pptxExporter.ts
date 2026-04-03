import PptxGenJS from "pptxgenjs";
import * as JSZip from "jszip";
import type { GeneratedSlide } from "./types";

const SLIDE_WIDTH = 13.33; // inches (16:9 widescreen)
const SLIDE_HEIGHT = 7.5;
const PADDING = 0.5; // inches

// Parchment-style background colors
const BG_COLOR = "F5E6C8";
const TEXT_COLOR = "1A1A1A";
const FONT_FACE = "Arial";

// Calculate font size (in pt) that fits the text within the available area.
// Uses word-based wrapping to simulate how PowerPoint lays out text.
export function calculateFontSize(
  text: string,
  areaWidthInches: number,
  areaHeightInches: number
): number {
  const lineHeightMultiple = 2.0;
  // Average character width in Arial Bold is ~0.62 of the font's em size.
  const avgCharWidthFactor = 0.62;
  const areaWidthPt = areaWidthInches * 72;
  const areaHeightPt = areaHeightInches * 72;

  // Split by explicit newlines first, then word-wrap each line
  const explicitLines = text.split("\n");

  for (let fontSize = 24; fontSize >= 10; fontSize -= 1) {
    const charWidthPt = fontSize * avgCharWidthFactor;
    const spaceWidthPt = charWidthPt;
    const lineHeightPt = fontSize * lineHeightMultiple;

    let lineCount = 0;

    for (const line of explicitLines) {
      const words = line.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        lineCount++;
        continue;
      }
      lineCount++;
      let currentLinePt = 0;

      for (const word of words) {
        const wordWidthPt = word.length * charWidthPt;
        const needed =
          currentLinePt === 0 ? wordWidthPt : spaceWidthPt + wordWidthPt;

        if (currentLinePt + needed > areaWidthPt && currentLinePt > 0) {
          lineCount++;
          currentLinePt = wordWidthPt;
        } else {
          currentLinePt += needed;
        }
      }
    }

    const totalHeightPt = lineCount * lineHeightPt;
    if (totalHeightPt <= areaHeightPt) {
      return fontSize;
    }
  }
  return 10;
}

// Convert text with \n into pptxgenjs TextProps array for reliable line breaks
function textToProps(
  text: string,
  opts: { fontSize: number; fontFace: string; color: string; bold: boolean }
): PptxGenJS.TextProps[] {
  return text.split("\n").map((line, i, arr) => ({
    text: line,
    options: {
      fontSize: opts.fontSize,
      fontFace: opts.fontFace,
      color: opts.color,
      bold: opts.bold,
      breakLine: i < arr.length - 1,
    },
  }));
}

export async function exportToPptx(
  slides: GeneratedSlide[],
  layoutRatio: number,
  filename: string = "slides"
): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Slide Generator";
  pptx.title = filename;

  for (const slideData of slides) {
    const slide = pptx.addSlide();
    slide.background = { color: BG_COLOR };

    const hasImage = !!slideData.imageDataUrl;
    const textWidth = hasImage
      ? SLIDE_WIDTH * layoutRatio - PADDING * 2
      : SLIDE_WIDTH - PADDING * 2;
    const textX = PADDING;
    const textY = PADDING;
    const textH = SLIDE_HEIGHT - PADDING * 2;

    const fontSize = calculateFontSize(slideData.text, textWidth, textH);

    // Use TextProps array for proper line break handling
    const textProps = textToProps(slideData.text, {
      fontSize,
      fontFace: FONT_FACE,
      color: TEXT_COLOR,
      bold: true,
    });

    slide.addText(textProps, {
      x: textX,
      y: textY,
      w: textWidth,
      h: textH,
      valign: "middle",
      lineSpacingMultiple: 2.0,
      wrap: true,
    });

    // Add image if present
    if (hasImage && slideData.imageDataUrl) {
      const imageX = SLIDE_WIDTH * layoutRatio;
      const imageW = SLIDE_WIDTH * (1 - layoutRatio);

      slide.addImage({
        data: slideData.imageDataUrl,
        x: imageX,
        y: 0,
        w: imageW,
        h: SLIDE_HEIGHT,
      });
    }
  }

  // Generate as arraybuffer, then post-process with JSZip to fix OOXML
  // compliance issues that cause Canva and other strict parsers to reject the file.
  const rawData = await pptx.write({ outputType: "arraybuffer", compression: true }) as ArrayBuffer;
  const fixedBlob = await fixPptxForCompatibility(rawData);

  // Trigger download
  const url = URL.createObjectURL(fixedBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.pptx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Post-process the PPTX to fix pptxgenjs OOXML spec violations that cause
// Canva (and other strict parsers) to reject the file.
//
// Key bugs in pptxgenjs v4:
// 1. [Content_Types].xml declares phantom slideMaster entries (one per slide,
//    but only slideMaster1.xml actually exists in the ZIP)
// 2. Microsoft-specific extension elements (p:extLst, thm15:themeFamily) that
//    strict parsers don't recognize
// 3. Missing conformance attribute on <p:presentation>
async function fixPptxForCompatibility(data: ArrayBuffer): Promise<Blob> {
  const zip = await JSZip.loadAsync(data);

  // FIX 1: Remove phantom slideMaster overrides from [Content_Types].xml
  // pptxgenjs creates one slideMaster entry per slide, but only slideMaster1 exists
  const contentTypesFile = zip.file("[Content_Types].xml");
  if (contentTypesFile) {
    let ct = await contentTypesFile.async("string");

    // Find which slideMasters actually exist in the ZIP
    const existingMasters = new Set<string>();
    zip.folder("ppt/slideMasters")?.forEach((relativePath) => {
      existingMasters.add(`/ppt/slideMasters/${relativePath}`);
    });

    // Remove Override entries for slideMasters that don't exist
    ct = ct.replace(
      /<Override\s+PartName="(\/ppt\/slideMasters\/[^"]+)"[^/]*\/>/g,
      (match, partName: string) => {
        return existingMasters.has(partName) ? match : "";
      }
    );

    // Similarly fix notesSlides — remove entries for non-existent ones
    const existingNotes = new Set<string>();
    zip.folder("ppt/notesSlides")?.forEach((relativePath) => {
      existingNotes.add(`/ppt/notesSlides/${relativePath}`);
    });
    ct = ct.replace(
      /<Override\s+PartName="(\/ppt\/notesSlides\/[^"]+)"[^/]*\/>/g,
      (match, partName: string) => {
        return existingNotes.has(partName) ? match : "";
      }
    );

    zip.file("[Content_Types].xml", ct);
  }

  // FIX 2: Strip Microsoft-specific extension lists from presentation.xml
  const presFile = zip.file("ppt/presentation.xml");
  if (presFile) {
    let pres = await presFile.async("string");

    // Add conformance="transitional" if missing
    pres = pres.replace(
      /<p:presentation\s/,
      '<p:presentation conformance="transitional" '
    );
    // Avoid duplicate if already present
    pres = pres.replace(
      /conformance="transitional"\s+conformance="transitional"/,
      'conformance="transitional"'
    );

    // Remove <p:extLst>...</p:extLst> blocks
    pres = pres.replace(/<p:extLst>[\s\S]*?<\/p:extLst>/g, "");

    zip.file("ppt/presentation.xml", pres);
  }

  // FIX 3: Strip extension elements from theme
  const themeFile = zip.file("ppt/theme/theme1.xml");
  if (themeFile) {
    let theme = await themeFile.async("string");
    // Remove thm15:themeFamily and its containing extLst
    theme = theme.replace(/<a:extLst>[\s\S]*?<\/a:extLst>/g, "");
    zip.file("ppt/theme/theme1.xml", theme);
  }

  // FIX 4: Strip extension elements from viewProps
  const viewPropsFile = zip.file("ppt/viewProps.xml");
  if (viewPropsFile) {
    let vp = await viewPropsFile.async("string");
    vp = vp.replace(/<p:extLst>[\s\S]*?<\/p:extLst>/g, "");
    zip.file("ppt/viewProps.xml", vp);
  }

  // FIX 5: Normalize all XML files to consistent CRLF line endings
  const xmlFiles = zip.filter((_relativePath, file) =>
    !file.dir && (file.name.endsWith(".xml") || file.name.endsWith(".rels"))
  );
  for (const file of xmlFiles) {
    let content = await file.async("string");
    // Normalize to LF first, then to CRLF
    content = content.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
    zip.file(file.name, content);
  }

  // Re-generate the ZIP with DEFLATE compression
  return await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
