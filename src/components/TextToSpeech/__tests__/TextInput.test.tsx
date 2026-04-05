import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TextInput from "../TextInput";

describe("TextInput", () => {
  it("renders textarea with placeholder", () => {
    render(<TextInput text="" onChange={vi.fn()} />);
    expect(
      screen.getByPlaceholderText(/Enter the text you want to convert/)
    ).toBeInTheDocument();
  });

  it("calls onChange when typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextInput text="" onChange={onChange} />);

    await user.type(screen.getByPlaceholderText(/Enter the text/), "H");
    expect(onChange).toHaveBeenCalledWith("H");
  });

  it("shows character count", () => {
    render(<TextInput text="Hello" onChange={vi.fn()} />);
    expect(screen.getByText("5 characters")).toBeInTheDocument();
  });

  it("shows warning for text over 5000 chars", () => {
    const longText = "a".repeat(5001);
    render(<TextInput text={longText} onChange={vi.fn()} />);
    expect(
      screen.getByText(/long text may take a while/)
    ).toBeInTheDocument();
  });

  it("does not show warning for text under 5000 chars", () => {
    render(<TextInput text="Short text" onChange={vi.fn()} />);
    expect(
      screen.queryByText(/long text may take a while/)
    ).not.toBeInTheDocument();
  });
});
