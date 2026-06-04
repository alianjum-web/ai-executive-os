import { render, screen } from "@testing-library/react";
import { Input } from "../Input";

test("renders label and associates with input", () => {
  render(<Input label="Email" />);
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
});

test("shows error message when provided", () => {
  render(<Input label="Email" error="Required" />);
  expect(screen.getByText("Required")).toBeInTheDocument();
});
