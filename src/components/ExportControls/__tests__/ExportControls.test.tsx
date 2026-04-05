import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExportControls from "../ExportControls";
import type { GeneratedSlide } from "@/lib/types";

vi.mock("@/lib/pptxExporter", () => ({
  exportToPptx: vi.fn(() => Promise.resolve()),
}));

const mockSlides: GeneratedSlide[] = [
  { id: "1", entryId: "e1", text: "Test", imageDataUrl: null, slideIndex: 0 },
];

describe("ExportControls", () => {
  it("renders export button", () => {
    render(<ExportControls slides={mockSlides} layoutRatio={0.65} />);
    expect(screen.getByText("Download PPTX")).toBeInTheDocument();
  });

  it("disables button when no slides", () => {
    render(<ExportControls slides={[]} layoutRatio={0.65} />);
    expect(screen.getByText("Download PPTX")).toBeDisabled();
  });

  it("calls exportToPptx on click", async () => {
    const user = userEvent.setup();
    const { exportToPptx } = await import("@/lib/pptxExporter");

    render(<ExportControls slides={mockSlides} layoutRatio={0.65} />);
    await user.click(screen.getByText("Download PPTX"));

    expect(exportToPptx).toHaveBeenCalledWith(mockSlides, 0.65, "slides");
  });

  it("shows exporting state during export", async () => {
    const user = userEvent.setup();
    let resolveExport: () => void;
    const { exportToPptx } = await import("@/lib/pptxExporter");
    vi.mocked(exportToPptx).mockImplementation(
      () => new Promise<void>((resolve) => { resolveExport = resolve; })
    );

    render(<ExportControls slides={mockSlides} layoutRatio={0.65} />);
    const clickPromise = user.click(screen.getByText("Download PPTX"));

    // Wait for the button text to change
    await screen.findByText("Exporting...");

    resolveExport!();
    await clickPromise;
  });
});
