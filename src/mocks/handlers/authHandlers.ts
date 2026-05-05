import type {
  ApiError,
  ApiResponse,
  AuthSession,
  CurrentUser,
  LoginInput,
  RegisterInput,
  UserRole,
} from '@/src/types';

import { cloneCurrentUser, cloneDemoPersonaUser, createAnonymousMockUser, mockDb } from '@/src/mocks/mockDb';
import { mockDelay } from '@/src/mocks/mockDelay';
import { fail, ok } from '@/src/mocks/mockResponse';

function affiliationForRole(role: UserRole): string {
  switch (role) {
    case 'host':
      return 'Host · TLAC';
    case 'admin':
      return 'Admin · TLAC';
    default:
      return 'Student/Fan · TLAC';
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildRegisterUser(input: RegisterInput): CurrentUser {
  const role = input.role ?? 'student';
  const first = input.firstName.trim();
  const last = input.lastName.trim();
  const initials =
    `${first.charAt(0) ?? ''}${last.charAt(0) ?? ''}`.toUpperCase().slice(0, 2) || 'TL';

  return {
    id: `user-${Date.now()}`,
    firstName: first,
    lastName: last,
    role,
    displayName: `${first} ${last}`.trim(),
    avatarInitials: initials,
    affiliationLabel: affiliationForRole(role),
    pickupStreak: 0,
    savedTailgateIds: [],
    claimedSurplusIds: [],
  };
}

export async function login(input: LoginInput): Promise<ApiResponse<AuthSession> | ApiError> {
  await mockDelay();

  const email = input.email.trim();
  const password = input.password.trim();
  if (email.length === 0 || password.length === 0) {
    return fail('Email and password are required', 'BAD_REQUEST');
  }

  const emailKey = normalizeEmail(email);
  const entry = mockDb.usersByEmail[emailKey];
  if (entry === undefined || entry.password !== password) {
    return fail(
      'No account found for those credentials. Create an account or use Demo Mode.',
      'UNAUTHORIZED'
    );
  }

  const sessionUser = cloneCurrentUser(entry.user);
  mockDb.currentUser = sessionUser;

  const session: AuthSession = {
    user: sessionUser,
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
  };
  return ok(session);
}

export async function register(
  input: RegisterInput
): Promise<ApiResponse<AuthSession> | ApiError> {
  await mockDelay();

  const emailRaw = input.email.trim();
  const password = input.password.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (emailRaw.length === 0 || password.length === 0 || firstName.length === 0 || lastName.length === 0) {
    return fail('Missing required registration fields', 'BAD_REQUEST');
  }

  const emailKey = normalizeEmail(emailRaw);
  if (mockDb.usersByEmail[emailKey] !== undefined) {
    return fail('An account with this email already exists. Sign in instead.', 'CONFLICT');
  }

  const createdUser = buildRegisterUser(input);
  mockDb.usersByEmail[emailKey] = {
    user: cloneCurrentUser(createdUser),
    password,
  };
  mockDb.currentUser = cloneCurrentUser(createdUser);

  const session: AuthSession = {
    user: mockDb.currentUser,
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
  };
  return ok(session);
}

/**
 * Loads the seeded Bright Dikko demo persona — only for explicit Demo Mode (not credential login).
 */
export async function loginDemo(): Promise<ApiResponse<AuthSession> | ApiError> {
  await mockDelay();
  const sessionUser = cloneDemoPersonaUser();
  mockDb.currentUser = sessionUser;

  const session: AuthSession = {
    user: sessionUser,
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
  };
  return ok(session);
}

export async function logout(): Promise<ApiResponse<null>> {
  await mockDelay();
  mockDb.currentUser = createAnonymousMockUser();
  return ok(null);
}

export async function getMe(): Promise<ApiResponse<CurrentUser>> {
  await mockDelay();
  return ok(mockDb.currentUser);
}

export const authHandlers = {
  login,
  register,
  loginDemo,
  logout,
  getMe,
};
