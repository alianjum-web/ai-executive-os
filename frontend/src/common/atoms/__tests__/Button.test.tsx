import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../Button";

test("calls onClick when clicked", () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Submit</Button>);
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(handleClick).toHaveBeenCalledTimes(1);
});

test("shows loading spinner when isLoading=true", () => {
  render(<Button isLoading>Submit</Button>);
  expect(screen.getByTestId("spinner")).toBeInTheDocument();
});
