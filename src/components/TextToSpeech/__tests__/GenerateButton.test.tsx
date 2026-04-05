import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GenerateButton from "../GenerateButton";

describe("GenerateButton", () => {
  it("renders Generate Speech text", () => {
    render(
      <GenerateButton onClick={vi.fn()} disabled={false} isGenerating={false} />
    );
    expect(screen.getByText("Generate Speech")).toBeInTheDocument();
  });

  it("calls onClick on click", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <GenerateButton onClick={onClick} disabled={false} isGenerating={false} />
    );

    await user.click(screen.getByText("Generate Speech"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <GenerateButton onClick={vi.fn()} disabled={true} isGenerating={false} />
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when generating", () => {
    render(
      <GenerateButton onClick={vi.fn()} disabled={false} isGenerating={true} />
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows spinner when generating", () => {
    render(
      <GenerateButton onClick={vi.fn()} disabled={false} isGenerating={true} />
    );
    expect(screen.getByText("Generating...")).toBeInTheDocument();
  });
});
