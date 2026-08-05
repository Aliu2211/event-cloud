import { Amplify } from "aws-amplify";
import {
  confirmResetPassword,
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    },
  },
});

export async function login(email: string, password: string) {
  // The Cognito app client only has ALLOW_USER_PASSWORD_AUTH enabled (no SRP),
  // so the auth flow must be requested explicitly — Amplify defaults to SRP.
  return signIn({ username: email, password, options: { authFlowType: "USER_PASSWORD_AUTH" } });
}

export async function register(email: string, password: string, fullName: string) {
  return signUp({
    username: email,
    password,
    options: { userAttributes: { email, name: fullName } },
  });
}

export async function confirmRegistration(email: string, code: string) {
  return confirmSignUp({ username: email, confirmationCode: code });
}

export async function requestPasswordReset(email: string) {
  return resetPassword({ username: email });
}

export async function confirmPasswordReset(email: string, code: string, newPassword: string) {
  return confirmResetPassword({ username: email, confirmationCode: code, newPassword });
}

export async function logout() {
  return signOut();
}

export async function currentUser() {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

export async function getIdToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}
