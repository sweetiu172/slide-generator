import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SlidePreviewGrid from "../SlidePreviewGrid";
import type { GeneratedSlide } from "@/lib/types";

const mockSlides: GeneratedSlide[] = [
  { id: "1", entryId: "e1", text: "Slide one", imageDataUrl: null, slideIndex: 0 },
  { id: "2", entryId: "e1", text: "Slide two", imageDataUrl: null, slideIndex: 1 },
];

describe("SlidePreviewGrid", () => {
  it("returns null when slides array is empty", () => {
    const { container } = render(
      <SlidePreviewGrid slides={[]} layoutRatio={0.65} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders heading with slide count", () => {
    render(<SlidePreviewGrid slides={mockSlides} layoutRatio={0.65} />);
    expect(screen.getByText("Generated Slides (2)")).toBeInTheDocument();
  });

  it("renders slide labels for each slide", () => {
    render(<SlidePreviewGrid slides={mockSlides} layoutRatio={0.65} />);
    expect(screen.getByText("Slide 1")).toBeInTheDocument();
    expect(screen.getByText("Slide 2")).toBeInTheDocument();
  });
});
