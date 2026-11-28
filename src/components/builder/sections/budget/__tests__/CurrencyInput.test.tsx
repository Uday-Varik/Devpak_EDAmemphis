import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CurrencyInput, PercentageInput } from "../CurrencyInput";

describe("CurrencyInput", () => {
  it("tells the user when a minus sign is typed", () => {
    render(<CurrencyInput value={0} onChange={() => {}} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "-500" } });
    expect(screen.getByRole("alert").textContent).toMatch(/cannot be negative/i);
  });

  it("does not show the hint for a positive amount", () => {
    render(<CurrencyInput value={0} onChange={() => {}} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "500" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("PercentageInput", () => {
  it("keeps the value between 0 and 100", () => {
    const onChange = vi.fn();
    render(<PercentageInput value={5} onChange={onChange} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "150" } });
    expect(onChange).toHaveBeenLastCalledWith(100);
    fireEvent.change(input, { target: { value: "-5" } });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });
});
