import { ZONES, type UserRole } from '../../src/domain';
import { httpErrors } from '../security/errors';
import { assertNoUnknownFields, isNonEmptyString } from './common';

export interface FisherProfileDetailDto {
  nickname: string;
  document: string;
  port: string;
  memberCode: string;
  photoId: string | null;
}

export interface UserProfileDto {
  userId: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  address: string;
  textSize: 'normal' | 'large' | 'extra';
  readInstructions: boolean;
  fisherDetail: FisherProfileDetailDto | null;
}

export interface AuthSessionResponseDto {
  token: string;
  profile: UserProfileDto;
}

export interface LoginInput {
  email: string;
  password: string;
  oneTouch?: boolean;
}

export interface OnboardingInput {
  role: 'client' | 'fisher';
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
  nickname?: string;
  document?: string;
  port?: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  textSize?: 'normal' | 'large' | 'extra';
  readInstructions?: boolean;
  photoId?: string;
}

export interface ChangeCredentialsInput {
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
}

export function normalizeEmailInput(rawEmail: unknown): string {
  if (typeof rawEmail !== 'string') return '';
  return rawEmail.trim().toLowerCase();
}

export function isValidEmailAddress(email: string): boolean {
  return email.length >= 5 && email.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseLoginInput(raw: Record<string, unknown>): LoginInput {
  const extra = assertNoUnknownFields(raw, ['email', 'password', 'oneTouch']);
  if (extra.length > 0) {
    throw httpErrors.validation(`Campos no permitidos en login: ${extra.join(', ')}.`);
  }

  const email = normalizeEmailInput(raw.email);
  if (!isValidEmailAddress(email)) {
    throw httpErrors.validation('Ingresa un correo electrónico válido.');
  }
  const oneTouch = raw.oneTouch === true;
  const password = typeof raw.password === 'string' ? raw.password : '';
  if (!oneTouch && (password.length < 1 || password.length > 128)) {
    throw httpErrors.validation('Ingresa tu contraseña.');
  }

  return { email, password, ...(oneTouch ? { oneTouch: true } : {}) };
}

export function parseOnboardingInput(raw: Record<string, unknown>): OnboardingInput {
  const extra = assertNoUnknownFields(raw, [
    'role',
    'email',
    'password',
    'name',
    'phone',
    'address',
    'nickname',
    'document',
    'port',
  ]);
  if (extra.length > 0) {
    throw httpErrors.validation(`Campos no permitidos en registro: ${extra.join(', ')}.`);
  }

  if (raw.role === 'admin') {
    throw httpErrors.forbidden('No se permite registrar cuentas de administración por vía pública.');
  }
  if (raw.role !== 'client' && raw.role !== 'fisher') {
    throw httpErrors.validation('El rol de registro debe ser "client" o "fisher".');
  }

  const email = normalizeEmailInput(raw.email);
  if (!isValidEmailAddress(email)) {
    throw httpErrors.validation('Ingresa un correo electrónico válido.');
  }

  const validFisherPin = raw.role === 'fisher' && typeof raw.password === 'string' && /^\d{4}$/.test(raw.password);
  if (
    typeof raw.password !== 'string' ||
    (!validFisherPin && (raw.password.length < 8 || raw.password.length > 128))
  ) {
    throw httpErrors.validation('La contraseña debe tener entre 8 y 128 caracteres.');
  }

  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (name.length < 2 || name.length > 100) {
    throw httpErrors.validation('Ingresa tu nombre completo (entre 2 y 100 caracteres).');
  }

  if (raw.role === 'client') {
    const phone = typeof raw.phone === 'string' ? raw.phone.trim() : '';
    const address = typeof raw.address === 'string' ? raw.address.trim() : '';
    if (!/^3\d{9}$/.test(phone)) {
      throw httpErrors.validation('Ingresa un celular válido de 10 dígitos (iniciando en 3).');
    }
    if (address.length < 8 || address.length > 180) {
      throw httpErrors.validation('Ingresa una dirección de entrega válida (8 a 180 caracteres).');
    }
    return {
      role: 'client',
      email,
      password: raw.password,
      name,
      phone,
      address,
    };
  }

  // role === 'fisher'
  const nickname = typeof raw.nickname === 'string' ? raw.nickname.trim() : '';
  const document = typeof raw.document === 'string' ? raw.document.trim() : '';
  const port = typeof raw.port === 'string' ? raw.port.trim() : '';

  if (!isNonEmptyString(nickname, 80)) {
    throw httpErrors.validation('Ingresa el apodo o nombre tradicional del pescador.');
  }
  if (!/^\d{6,12}$/.test(document)) {
    throw httpErrors.validation('Ingresa un documento numérico válido de 6 a 12 dígitos.');
  }
  if (!ZONES.includes(port)) {
    throw httpErrors.validation('Selecciona un puerto o zona de pesca válida.');
  }

  return {
    role: 'fisher',
    email,
    password: raw.password,
    name,
    nickname,
    document,
    port,
  };
}

export function parseUpdateProfileInput(raw: Record<string, unknown>): UpdateProfileInput {
  const extra = assertNoUnknownFields(raw, [
    'name',
    'email',
    'phone',
    'address',
    'textSize',
    'readInstructions',
    'photoId',
  ]);
  if (extra.length > 0) {
    throw httpErrors.validation(`Campos no permitidos al editar perfil: ${extra.join(', ')}.`);
  }

  if (
    raw.name === undefined &&
    raw.email === undefined &&
    raw.phone === undefined &&
    raw.address === undefined &&
    raw.textSize === undefined &&
    raw.readInstructions === undefined &&
    raw.photoId === undefined
  ) {
    throw httpErrors.validation('Indica al menos un dato de perfil para actualizar.');
  }

  const out: UpdateProfileInput = {};

  if (raw.name !== undefined) {
    if (typeof raw.name !== 'string' || raw.name.trim().length < 2 || raw.name.trim().length > 100) {
      throw httpErrors.validation('El nombre debe tener entre 2 y 100 caracteres.');
    }
    out.name = raw.name.trim();
  }
  if (raw.email !== undefined) {
    const email = normalizeEmailInput(raw.email);
    if (!isValidEmailAddress(email)) {
      throw httpErrors.validation('Ingresa un correo electrónico válido.');
    }
    out.email = email;
  }
  if (raw.phone !== undefined) {
    if (typeof raw.phone !== 'string' || !/^3\d{9}$/.test(raw.phone.trim())) {
      throw httpErrors.validation('Ingresa un celular válido de 10 dígitos.');
    }
    out.phone = raw.phone.trim();
  }
  if (raw.address !== undefined) {
    if (
      typeof raw.address !== 'string' ||
      raw.address.trim().length < 8 ||
      raw.address.trim().length > 180
    ) {
      throw httpErrors.validation('La dirección debe tener entre 8 y 180 caracteres.');
    }
    out.address = raw.address.trim();
  }
  if (raw.textSize !== undefined) {
    if (raw.textSize !== 'normal' && raw.textSize !== 'large' && raw.textSize !== 'extra') {
      throw httpErrors.validation('El tamaño de texto debe ser "normal", "large" o "extra".');
    }
    out.textSize = raw.textSize;
  }
  if (raw.readInstructions !== undefined) {
    if (typeof raw.readInstructions !== 'boolean') {
      throw httpErrors.validation('readInstructions debe ser booleano.');
    }
    out.readInstructions = raw.readInstructions;
  }
  if (raw.photoId !== undefined && typeof raw.photoId === 'string') {
    out.photoId = raw.photoId;
  }

  return out;
}

export function parseChangeCredentialsInput(raw: Record<string, unknown>): ChangeCredentialsInput {
  const extra = assertNoUnknownFields(raw, ['currentPassword', 'newEmail', 'newPassword']);
  if (extra.length > 0) {
    throw httpErrors.validation(`Campos no permitidos en credenciales: ${extra.join(', ')}.`);
  }

  if (typeof raw.currentPassword !== 'string' || raw.currentPassword.length === 0) {
    throw httpErrors.validation('Debes ingresar tu contraseña actual.');
  }

  if (raw.newEmail === undefined && raw.newPassword === undefined) {
    throw httpErrors.validation('Indica un nuevo correo o una nueva contraseña.');
  }

  const out: ChangeCredentialsInput = { currentPassword: raw.currentPassword };

  if (raw.newEmail !== undefined) {
    const email = normalizeEmailInput(raw.newEmail);
    if (!isValidEmailAddress(email)) {
      throw httpErrors.validation('Ingresa un nuevo correo electrónico válido.');
    }
    out.newEmail = email;
  }

  if (raw.newPassword !== undefined) {
    if (
      typeof raw.newPassword !== 'string' ||
      raw.newPassword.length < 8 ||
      raw.newPassword.length > 128
    ) {
      throw httpErrors.validation('La nueva contraseña debe tener entre 8 y 128 caracteres.');
    }
    out.newPassword = raw.newPassword;
  }

  return out;
}
