import type {
  ApiError,
  ApiResponse,
  AuthSession,
  CurrentUser,
  LoginInput,
  RegisterInput,
  UserRole,
} from '@/src/types';

import { mockDb } from '@/src/mocks/mockDb';
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

export async function login(
  input: LoginInput
): Promise<ApiResponse<AuthSession> | ApiError> {
  await mockDelay();

  const email = input.email.trim();
  const password = input.password.trim();
  if (email.length === 0 || password.length === 0) {
    return fail('Email and password are required', 'BAD_REQUEST');
  }

  const session: AuthSession = {
    user: mockDb.currentUser,
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

  const email = input.email.trim();
  const password = input.password.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (email.length === 0 || password.length === 0 || firstName.length === 0 || lastName.length === 0) {
    return fail('Missing required registration fields', 'BAD_REQUEST');
  }

  const createdUser = buildRegisterUser(input);
  mockDb.currentUser = createdUser;

  const session: AuthSession = {
    user: createdUser,
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
  };
  return ok(session);
}

export async function logout(): Promise<ApiResponse<null>> {
  await mockDelay();
  return ok(null);
}

export async function getMe(): Promise<ApiResponse<CurrentUser>> {
  await mockDelay();
  return ok(mockDb.currentUser);
}

export const authHandlers = {
  login,
  register,
  logout,
  getMe,
};
