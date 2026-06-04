import type {
  FieldErrors,
  FieldValues,
  Resolver,
  ResolverError,
  ResolverSuccess,
} from "react-hook-form";
import {
  validateLoginFields,
  validateSignupFields,
  hasFieldErrors,
} from "@/auth/services/validation";

export type LoginFormValues = {
  email: string;
  password: string;
};

export type SignupFormValues = LoginFormValues & {
  fullName: string;
  orgName: string;
};

function toRhfErrors<T extends FieldValues>(
  errors: Record<string, string | undefined>
): FieldErrors<T> {
  const out = {} as FieldErrors<T>;
  for (const [key, message] of Object.entries(errors)) {
    if (message) {
      (out as Record<string, { type: string; message: string }>)[key] = {
        type: "manual",
        message,
      };
    }
  }
  return out;
}

function validationFailure<T extends FieldValues>(
  errors: Record<string, string | undefined>
): ResolverError<T> {
  return {
    values: {},
    errors: toRhfErrors<T>(errors),
  };
}

export const loginResolver: Resolver<LoginFormValues> = async (values) => {
  const errors = validateLoginFields(values.email, values.password);
  if (hasFieldErrors(errors)) {
    return validationFailure<LoginFormValues>(errors);
  }
  const result: ResolverSuccess<LoginFormValues> = {
    values: {
      email: values.email.trim(),
      password: values.password,
    },
    errors: {},
  };
  return result;
};

export const signupResolver: Resolver<SignupFormValues> = async (values) => {
  const errors = validateSignupFields(
    values.email,
    values.password,
    values.orgName,
    values.fullName
  );
  if (hasFieldErrors(errors)) {
    return validationFailure<SignupFormValues>(errors);
  }
  const result: ResolverSuccess<SignupFormValues> = {
    values: {
      email: values.email.trim(),
      password: values.password,
      fullName: values.fullName.trim(),
      orgName: values.orgName.trim(),
    },
    errors: {},
  };
  return result;
};
