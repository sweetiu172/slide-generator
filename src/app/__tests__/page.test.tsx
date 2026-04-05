import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../page";

// Mock the hook
const mockHook = {
  entries: [{ id: "1", text: "", imageFile: null, imageDataUrl: null }],
  generatedSlides: [],
  layoutRatio: 0.65,
  isGenerated: false,
  addEntry: vi.fn(),
  removeEntry: vi.fn(),
  updateEntryText: vi.fn(),
  setEntryImage: vi.fn(),
  setLayoutRatio: vi.fn(),
  generateSlides: vi.fn(),
  reset: vi.fn(),
};

vi.mock("@/hooks/useSlideGenerator", () => ({
  useSlideGenerator: () => mockHook,
}));

vi.mock("react-dropzone", () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  })),
}));

describe("Home page", () => {
  it("renders navigation and slide entry form", () => {
    render(<Home />);
    expect(screen.getByText("Slides")).toBeInTheDocument();
    expect(screen.getByText("Slide Entry 1")).toBeInTheDocument();
    expect(screen.getByText("Generate Slides")).toBeInTheDocument();
  });

  it("disables generate button when no text entered", () => {
    render(<Home />);
    expect(screen.getByText("Generate Slides")).toBeDisabled();
  });

  it("enables generate button when text is entered", () => {
    mockHook.entries = [{ id: "1", text: "Some text", imageFile: null, imageDataUrl: null }];
    render(<Home />);
    expect(screen.getByText("Generate Slides")).not.toBeDisabled();
    mockHook.entries = [{ id: "1", text: "", imageFile: null, imageDataUrl: null }];
  });

  it("shows Start Over and preview when slides are generated", () => {
    mockHook.isGenerated = true;
    mockHook.generatedSlides = [
      { id: "s1", entryId: "1", text: "Generated text", imageDataUrl: null, slideIndex: 0 },
    ];
    render(<Home />);
    expect(screen.getByText("Start Over")).toBeInTheDocument();
    expect(screen.getByText("Download PPTX")).toBeInTheDocument();
    mockHook.isGenerated = false;
    mockHook.generatedSlides = [];
  });

  it("calls reset when Start Over clicked", async () => {
    const user = userEvent.setup();
    mockHook.isGenerated = true;
    mockHook.generatedSlides = [
      { id: "s1", entryId: "1", text: "Test", imageDataUrl: null, slideIndex: 0 },
    ];
    render(<Home />);

    await user.click(screen.getByText("Start Over"));
    expect(mockHook.reset).toHaveBeenCalled();
    mockHook.isGenerated = false;
    mockHook.generatedSlides = [];
  });
});
