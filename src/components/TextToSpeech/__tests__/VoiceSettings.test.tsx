import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VoiceSettings from "../VoiceSettings";

const defaultProps = {
  lengthScale: 1.0,
  noiseScale: 0.667,
  noiseW: 0.8,
  onLengthScaleChange: vi.fn(),
  onNoiseScaleChange: vi.fn(),
  onNoiseWChange: vi.fn(),
};

describe("VoiceSettings", () => {
  it("renders collapsed by default", () => {
    render(<VoiceSettings {...defaultProps} />);
    expect(screen.getByText("Voice Settings")).toBeInTheDocument();
    expect(screen.queryByText("Speed")).not.toBeInTheDocument();
  });

  it("expands when toggle button clicked", async () => {
    const user = userEvent.setup();
    render(<VoiceSettings {...defaultProps} />);

    await user.click(screen.getByText("Voice Settings"));
    expect(screen.getByText("Speed")).toBeInTheDocument();
    expect(screen.getByText("Stability")).toBeInTheDocument();
    expect(screen.getByText("Style")).toBeInTheDocument();
  });

  it("shows slider values", async () => {
    const user = userEvent.setup();
    render(<VoiceSettings {...defaultProps} />);
    await user.click(screen.getByText("Voice Settings"));

    expect(screen.getByText("1.00")).toBeInTheDocument();
  });

  it("calls onChange handlers when sliders change", async () => {
    const user = userEvent.setup();
    const onLengthScaleChange = vi.fn();
    render(
      <VoiceSettings {...defaultProps} onLengthScaleChange={onLengthScaleChange} />
    );
    await user.click(screen.getByText("Voice Settings"));

    const sliders = screen.getAllByRole("slider");
    // Speed slider is the first one
    fireEvent.change(sliders[0], { target: { value: "1.5" } });
    expect(onLengthScaleChange).toHaveBeenCalledWith(1.5);
  });

  it("collapses when toggle clicked again", async () => {
    const user = userEvent.setup();
    render(<VoiceSettings {...defaultProps} />);

    await user.click(screen.getByText("Voice Settings"));
    expect(screen.getByText("Speed")).toBeInTheDocument();

    await user.click(screen.getByText("Voice Settings"));
    expect(screen.queryByText("Speed")).not.toBeInTheDocument();
  });
});
