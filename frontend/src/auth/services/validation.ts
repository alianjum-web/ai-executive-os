export type FieldErrors = Partial<Record<string, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginFields(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}

export function validateSignupFields(
  email: string,
  password: string,
  orgName: string
): FieldErrors {
  const errors = validateLoginFields(email, password);

  if (!orgName.trim()) {
    errors.orgName = "Organization name is required.";
  } else if (orgName.trim().length < 2) {
    errors.orgName = "Organization name must be at least 2 characters.";
  }

  return errors;
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
