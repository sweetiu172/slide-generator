import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SlideCanvas from "../SlideCanvas";
import type { GeneratedSlide } from "@/lib/types";

const textOnlySlide: GeneratedSlide = {
  id: "s1",
  entryId: "e1",
  text: "Hello World",
  imageDataUrl: null,
  slideIndex: 0,
};

const slideWithImage: GeneratedSlide = {
  id: "s2",
  entryId: "e1",
  text: "With image",
  imageDataUrl: "data:image/png;base64,abc",
  slideIndex: 1,
};

describe("SlideCanvas", () => {
  it("renders slide text", () => {
    render(<SlideCanvas slide={textOnlySlide} layoutRatio={0.65} />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("does not render image when imageDataUrl is null", () => {
    render(<SlideCanvas slide={textOnlySlide} layoutRatio={0.65} />);
    expect(screen.queryByAltText("Slide image")).not.toBeInTheDocument();
  });

  it("renders image when imageDataUrl is present", () => {
    render(<SlideCanvas slide={slideWithImage} layoutRatio={0.65} />);
    expect(screen.getByAltText("Slide image")).toBeInTheDocument();
    expect(screen.getByAltText("Slide image")).toHaveAttribute(
      "src",
      "data:image/png;base64,abc"
    );
  });

  it("applies scale prop to container dimensions", () => {
    const { container } = render(
      <SlideCanvas slide={textOnlySlide} layoutRatio={0.65} scale={0.5} />
    );
    const outer = container.firstChild as HTMLElement;
    expect(outer.style.width).toBe("640px"); // 1280 * 0.5
    expect(outer.style.height).toBe("360px"); // 720 * 0.5
  });

  it("uses default scale of 0.4", () => {
    const { container } = render(
      <SlideCanvas slide={textOnlySlide} layoutRatio={0.65} />
    );
    const outer = container.firstChild as HTMLElement;
    expect(outer.style.width).toBe("512px"); // 1280 * 0.4
    expect(outer.style.height).toBe("288px"); // 720 * 0.4
  });
});
