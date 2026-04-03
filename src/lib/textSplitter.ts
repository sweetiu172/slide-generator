const TARGET_WORDS_PER_SLIDE = 120;
const TOLERANCE = 0.15;

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function splitIntoSentences(text: string): string[] {
  // Split on paragraph breaks first, then sentences within paragraphs
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  const sentences: string[] = [];

  for (const paragraph of paragraphs) {
    // Split sentences at .!? followed by space and capital letter
    const parts = paragraph.split(/(?<=[.!?])\s+(?=[A-Z])/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed) {
        sentences.push(trimmed);
      }
    }
    // Add paragraph marker so we can prefer splitting at paragraph boundaries
    sentences.push("\n\n");
  }

  // Remove trailing paragraph marker
  if (sentences.length > 0 && sentences[sentences.length - 1] === "\n\n") {
    sentences.pop();
  }

  return sentences;
}

export function splitTextIntoSlides(
  text: string,
  targetWordsPerSlide: number = TARGET_WORDS_PER_SLIDE
): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const totalWords = countWords(trimmed);

  // If short enough for one slide, return as-is
  if (totalWords <= targetWordsPerSlide * (1 + TOLERANCE)) {
    return [trimmed];
  }

  const sentences = splitIntoSentences(trimmed);
  const numSlides = Math.ceil(totalWords / targetWordsPerSlide);
  const idealWords = totalWords / numSlides;
  const maxWords = idealWords * (1 + TOLERANCE);

  const slides: string[] = [];
  let currentChunks: string[] = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    // Paragraph markers are preferred split points
    if (sentence === "\n\n") {
      if (currentWordCount >= idealWords * 0.7 && currentChunks.length > 0) {
        slides.push(currentChunks.join(" "));
        currentChunks = [];
        currentWordCount = 0;
      }
      continue;
    }

    const sentenceWords = countWords(sentence);

    // If adding this sentence exceeds max and we have content, start new slide
    if (
      currentWordCount + sentenceWords > maxWords &&
      currentChunks.length > 0
    ) {
      slides.push(currentChunks.join(" "));
      currentChunks = [];
      currentWordCount = 0;
    }

    currentChunks.push(sentence);
    currentWordCount += sentenceWords;
  }

  // Add remaining content
  if (currentChunks.length > 0) {
    slides.push(currentChunks.join(" "));
  }

  // Rebalance: if last slide is too short, pull from previous
  if (slides.length > 1) {
    const lastSlide = slides[slides.length - 1];
    const lastWords = countWords(lastSlide);
    if (lastWords < idealWords * 0.5) {
      const prevSlide = slides[slides.length - 2];
      const combined = prevSlide + " " + lastSlide;
      const combinedSentences = combined.split(/(?<=[.!?])\s+(?=[A-Z])/);
      const halfPoint = Math.ceil(combinedSentences.length / 2);
      slides[slides.length - 2] = combinedSentences
        .slice(0, halfPoint)
        .join(" ");
      slides[slides.length - 1] = combinedSentences.slice(halfPoint).join(" ");
    }
  }

  return slides;
}

// Split a slide's text into one sentence (or short sentence group) per line.
// Short consecutive sentences (under ~60 chars combined) are merged onto one line.
export function formatSlideText(text: string): string {
  // Split on sentence boundaries: period/exclamation/question followed by space
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) return text;

  const lines: string[] = [];
  let currentLine = sentences[0];

  for (let i = 1; i < sentences.length; i++) {
    const combined = currentLine + " " + sentences[i];
    // Merge short sentences onto the same line (threshold: 80 chars)
    if (combined.length <= 80) {
      currentLine = combined;
    } else {
      lines.push(currentLine);
      currentLine = sentences[i];
    }
  }
  lines.push(currentLine);

  return lines.join("\n");
}
