import type {
  AuthSessionResponseDto,
  ChangeCredentialsInput,
  LoginInput,
  OnboardingInput,
  UpdateProfileInput,
  UserProfileDto,
} from '../../server/contracts/profile';
import { apiRequest } from './api';

let currentMemoryJwt: string | null = null;

export function getClientJwtToken(): string | null {
  return currentMemoryJwt;
}

export function setClientJwtToken(token: string | null): void {
  currentMemoryJwt = token;
}

export async function loginWithApi(input: LoginInput): Promise<AuthSessionResponseDto> {
  const response = await apiRequest<AuthSessionResponseDto>('/api/auth/login', {
    method: 'POST',
    body: input,
  });
  currentMemoryJwt = response.token;
  return response;
}

export async function registerWithApi(input: OnboardingInput): Promise<AuthSessionResponseDto> {
  const response = await apiRequest<AuthSessionResponseDto>('/api/me/onboarding', {
    method: 'POST',
    body: input,
  });
  currentMemoryJwt = response.token;
  return response;
}

export async function logoutFromApi(): Promise<void> {
  try {
    await apiRequest<void>('/api/auth/logout', {
      method: 'POST',
      token: currentMemoryJwt,
    });
  } finally {
    currentMemoryJwt = null;
  }
}

export async function fetchMyProfileFromApi(): Promise<UserProfileDto> {
  return apiRequest<UserProfileDto>('/api/me', {
    method: 'GET',
    token: currentMemoryJwt,
  });
}

export async function updateMyProfileInApi(input: UpdateProfileInput): Promise<UserProfileDto> {
  return apiRequest<UserProfileDto>('/api/me/profile', {
    method: 'PATCH',
    body: input,
    token: currentMemoryJwt,
  });
}

export async function changeMyCredentialsInApi(
  input: ChangeCredentialsInput,
): Promise<AuthSessionResponseDto> {
  const response = await apiRequest<AuthSessionResponseDto>('/api/me/credentials', {
    method: 'POST',
    body: input,
    token: currentMemoryJwt,
  });
  currentMemoryJwt = response.token;
  return response;
}
