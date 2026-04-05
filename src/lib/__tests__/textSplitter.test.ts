import { describe, it, expect } from "vitest";
import { splitTextIntoSlides, formatSlideText } from "../textSplitter";

describe("splitTextIntoSlides", () => {
  it("returns empty array for empty string", () => {
    expect(splitTextIntoSlides("")).toEqual([]);
  });

  it("returns empty array for whitespace-only input", () => {
    expect(splitTextIntoSlides("   \n\t  ")).toEqual([]);
  });

  it("returns single slide for short text", () => {
    const text = "This is a short sentence.";
    const result = splitTextIntoSlides(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });

  it("returns single slide when text is within tolerance", () => {
    // 120 words * 1.15 tolerance = 138 words should still be one slide
    const words = Array.from({ length: 130 }, (_, i) => `word${i}`);
    const text = words.join(" ") + ".";
    const result = splitTextIntoSlides(text);
    expect(result).toHaveLength(1);
  });

  it("splits long text into multiple slides", () => {
    // ~300 words should produce 2-3 slides
    const sentences = Array.from(
      { length: 30 },
      (_, i) => `This is sentence number ${i} with some extra words to fill space.`
    );
    const text = sentences.join(" ");
    const result = splitTextIntoSlides(text);
    expect(result.length).toBeGreaterThan(1);
  });

  it("respects paragraph boundaries as split points", () => {
    const para1 = Array.from({ length: 15 }, () => "The quick brown fox jumps over the lazy dog.").join(" ");
    const para2 = Array.from({ length: 15 }, () => "A second paragraph with enough words to fill.").join(" ");
    const text = para1 + "\n\n" + para2;
    const result = splitTextIntoSlides(text);
    expect(result.length).toBeGreaterThan(1);
  });

  it("does not split mid-sentence", () => {
    const sentences = Array.from(
      { length: 20 },
      (_, i) => `Sentence ${i} has some content here.`
    );
    const text = sentences.join(" ");
    const result = splitTextIntoSlides(text);
    for (const slide of result) {
      // Each slide should end with a period (complete sentence)
      expect(slide.trim()).toMatch(/\.$/);
    }
  });

  it("handles custom targetWordsPerSlide", () => {
    const sentences = Array.from(
      { length: 10 },
      (_, i) => `This is sentence ${i} with words.`
    );
    const text = sentences.join(" ");
    // With very small target, should produce more slides
    const smallTarget = splitTextIntoSlides(text, 20);
    const largeTarget = splitTextIntoSlides(text, 200);
    expect(smallTarget.length).toBeGreaterThan(largeTarget.length);
  });

  it("handles text with no sentence-ending punctuation", () => {
    const text = Array.from({ length: 200 }, (_, i) => `word${i}`).join(" ");
    const result = splitTextIntoSlides(text);
    // Should still produce slides even without punctuation
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("rebalances when last slide is too short", () => {
    // Create text where naive splitting would leave a very short last slide
    const longSentences = Array.from(
      { length: 12 },
      (_, i) => `This is a fairly long sentence number ${i} that contains enough words to matter for the splitting algorithm.`
    );
    const text = longSentences.join(" ") + " Short end.";
    const result = splitTextIntoSlides(text);
    if (result.length > 1) {
      const lastSlideWords = result[result.length - 1].split(/\s+/).filter(Boolean).length;
      // Last slide should not be trivially short (rebalancing should help)
      expect(lastSlideWords).toBeGreaterThan(3);
    }
  });
});

describe("formatSlideText", () => {
  it("returns single sentence unchanged", () => {
    const text = "This is a single sentence.";
    expect(formatSlideText(text)).toBe(text);
  });

  it("returns text without sentence endings unchanged", () => {
    const text = "No punctuation here";
    expect(formatSlideText(text)).toBe(text);
  });

  it("merges short consecutive sentences onto one line", () => {
    const text = "Short one. Short two. Short three.";
    const result = formatSlideText(text);
    // All short sentences should fit on one line (under 80 chars)
    expect(result).toBe("Short one. Short two. Short three.");
  });

  it("splits long sentences onto separate lines", () => {
    const s1 = "This is a fairly long first sentence that takes up quite a lot of space on the line.";
    const s2 = "This is another long sentence that also needs its own separate line in the output.";
    const text = s1 + " " + s2;
    const result = formatSlideText(text);
    expect(result).toContain("\n");
    const lines = result.split("\n");
    expect(lines.length).toBe(2);
  });

  it("handles empty string", () => {
    expect(formatSlideText("")).toBe("");
  });
});
