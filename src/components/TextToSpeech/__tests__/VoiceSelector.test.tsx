import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VoiceSelector from "../VoiceSelector";
import type { TTSVoice } from "@/lib/types";

const mockVoices: TTSVoice[] = [
  { id: "voice-1", name: "lessac (medium)", language: "en_US" },
  { id: "voice-2", name: "ryan (medium)", language: "en_US" },
];

describe("VoiceSelector", () => {
  it("renders voice options", () => {
    render(
      <VoiceSelector
        voices={mockVoices}
        selectedVoice="voice-1"
        onChange={vi.fn()}
        isLoading={false}
      />
    );
    expect(screen.getByText("lessac (medium) — en_US")).toBeInTheDocument();
    expect(screen.getByText("ryan (medium) — en_US")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <VoiceSelector
        voices={[]}
        selectedVoice=""
        onChange={vi.fn()}
        isLoading={true}
      />
    );
    expect(screen.getByText("Loading voices...")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("shows no voices message", () => {
    render(
      <VoiceSelector
        voices={[]}
        selectedVoice=""
        onChange={vi.fn()}
        isLoading={false}
      />
    );
    expect(screen.getByText("No voices available")).toBeInTheDocument();
  });

  it("calls onChange on selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <VoiceSelector
        voices={mockVoices}
        selectedVoice="voice-1"
        onChange={onChange}
        isLoading={false}
      />
    );

    await user.selectOptions(screen.getByRole("combobox"), "voice-2");
    expect(onChange).toHaveBeenCalledWith("voice-2");
  });
});
