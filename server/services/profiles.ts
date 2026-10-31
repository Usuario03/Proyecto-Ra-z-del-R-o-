import crypto from 'node:crypto';
import type {
  AuthSessionResponseDto,
  ChangeCredentialsInput,
  LoginInput,
  OnboardingInput,
  UpdateProfileInput,
  UserProfileDto,
} from '../contracts/profile';
import type { UserRole } from '../../src/domain';
import { type SessionClaims, signSessionJwt } from '../security/auth';
import { requireFreshPasswordAuth } from '../security/authorization';
import { getDbPool, type QueryExecutor, withTransaction } from '../db/db';
import { httpErrors } from '../security/errors';

export function hashPasswordScrypt(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password.normalize('NFKC'), salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPasswordScrypt(password: string, salt: string, expectedHashHex: string): boolean {
  const actualBuffer = crypto.scryptSync(password.normalize('NFKC'), salt, 64);
  const expectedBuffer = Buffer.from(expectedHashHex, 'hex');
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

interface ProfileJoinRow {
  user_id: string;
  role: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  text_size: string;
  read_instructions: boolean;
  nickname: string | null;
  document: string | null;
  port: string | null;
  member_code: string | null;
  photo_id: string | null;
}

function mapProfileRow(row: ProfileJoinRow): UserProfileDto {
  const textSize =
    row.text_size === 'large' || row.text_size === 'extra' ? row.text_size : 'normal';
  return {
    userId: row.user_id,
    role: row.role as UserRole,
    name: row.name,
    email: row.email ?? '',
    phone: row.phone ?? '',
    address: row.address ?? '',
    textSize,
    readInstructions: Boolean(row.read_instructions),
    fisherDetail: row.member_code
      ? {
          nickname: row.nickname ?? '',
          document: row.document ?? '',
          port: row.port ?? '',
          memberCode: row.member_code,
          photoId: row.photo_id ?? null,
        }
      : null,
  };
}

export async function getMyProfile(
  userId: string,
  db: QueryExecutor = getDbPool(),
): Promise<UserProfileDto> {
  const result = await db.query<ProfileJoinRow>(
    `
    SELECT
      p.user_id,
      p.role,
      p.name,
      ac.email,
      p.phone,
      p.address,
      p.text_size,
      p.read_instructions,
      fd.nickname,
      fd.document,
      fd.port,
      fd.member_code,
      fd.photo_id
    FROM public.profiles p
    LEFT JOIN public.auth_credentials ac ON ac.user_id = p.user_id
    LEFT JOIN public.fisher_details fd ON fd.user_id = p.user_id
    WHERE p.user_id = $1
    `,
    [userId],
  );

  const row = result.rows[0];
  if (!row) {
    throw httpErrors.notFound('Tu perfil no fue encontrado.');
  }
  return mapProfileRow(row);
}

export async function registerAndOnboardUser(
  input: OnboardingInput,
): Promise<AuthSessionResponseDto> {
  const { salt, hash } = hashPasswordScrypt(input.password);

  return withTransaction(async tx => {
    const emailExisting = await tx.query<{ user_id: string }>(
      `SELECT user_id FROM public.auth_credentials WHERE email = $1 FOR UPDATE`,
      [input.email],
    );
    if (emailExisting.rows.length > 0) {
      throw httpErrors.conflict('Ya existe una cuenta registrada con ese correo electrónico.');
    }

    if (input.role === 'fisher' && input.document) {
      const docExisting = await tx.query<{ user_id: string }>(
        `SELECT user_id FROM public.fisher_details WHERE document = $1 FOR UPDATE`,
        [input.document],
      );
      if (docExisting.rows.length > 0) {
        throw httpErrors.conflict('Ya existe un pescador registrado con ese número de documento.');
      }
    }

    const userId = crypto.randomUUID();
    await tx.query(
      `
      INSERT INTO public.profiles (
        user_id,
        role,
        name,
        phone,
        address,
        first_login_required,
        provisioning_pending,
        text_size,
        read_instructions
      ) VALUES ($1, $2, $3, $4, $5, false, false, 'normal', false)
      `,
      [
        userId,
        input.role,
        input.name,
        input.phone ?? null,
        input.address ?? null,
      ],
    );

    await tx.query(
      `
      INSERT INTO public.auth_credentials (user_id, email, password_salt, password_hash)
      VALUES ($1, $2, $3, $4)
      `,
      [userId, input.email, salt, hash],
    );

    let memberCode: string | undefined;
    if (input.role === 'fisher') {
      memberCode = `FP-${crypto.randomInt(1000, 9999)}`;
      await tx.query(
        `
        INSERT INTO public.fisher_details (
          user_id,
          nickname,
          document,
          port,
          member_code
        ) VALUES ($1, $2, $3, $4, $5)
        `,
        [userId, input.nickname ?? '', input.document ?? '', input.port ?? '', memberCode],
      );
    }

    const profile = await getMyProfile(userId, tx);
    const nowSec = Math.floor(Date.now() / 1000);
    const token = signSessionJwt({
      sub: userId,
      role: profile.role,
      name: profile.name,
      email: profile.email,
      ...(memberCode ? { memberCode } : {}),
      passwordAuthenticatedAt: nowSec,
    });

    return { token, profile };
  });
}

export async function authenticateWithPassword(
  input: LoginInput,
  db: QueryExecutor = getDbPool(),
): Promise<AuthSessionResponseDto> {
  const credRes = await db.query<{
    user_id: string;
    email: string;
    password_salt: string;
    password_hash: string;
  }>(
    `
    SELECT user_id, email, password_salt, password_hash
    FROM public.auth_credentials
    WHERE email = $1
    `,
    [input.email],
  );

  const cred = credRes.rows[0];
  if (!cred) {
    throw httpErrors.unauthorized('Correo electrónico o contraseña incorrectos.');
  }

  const profile = await getMyProfile(cred.user_id, db);
  if (input.oneTouch) {
    if (profile.role !== 'fisher') {
      throw httpErrors.unauthorized('El ingreso de un toque solo está disponible para pescadores.');
    }
  } else if (!verifyPasswordScrypt(input.password, cred.password_salt, cred.password_hash)) {
    throw httpErrors.unauthorized('Correo electrónico o contraseña incorrectos.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const token = signSessionJwt({
    sub: profile.userId,
    role: profile.role,
    name: profile.name,
    email: profile.email,
    ...(profile.fisherDetail?.memberCode
      ? { memberCode: profile.fisherDetail.memberCode }
      : {}),
    passwordAuthenticatedAt: nowSec,
  });

  return { token, profile };
}

export async function listPublicFishermen(
  db: QueryExecutor = getDbPool(),
): Promise<UserProfileDto[]> {
  const result = await db.query<ProfileJoinRow>(
    `
    SELECT
      p.user_id,
      p.role,
      p.name,
      ac.email,
      p.phone,
      p.address,
      p.text_size,
      p.read_instructions,
      fd.nickname,
      fd.document,
      fd.port,
      fd.member_code,
      fd.photo_id
    FROM public.profiles p
    INNER JOIN public.fisher_details fd ON fd.user_id = p.user_id
    LEFT JOIN public.auth_credentials ac ON ac.user_id = p.user_id
    WHERE p.role = 'fisher'
    ORDER BY fd.member_code ASC, p.created_at ASC
    `,
  );
  return result.rows.map(mapProfileRow);
}

export async function updateMyProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserProfileDto> {
  return withTransaction(async tx => {
    const existing = await tx.query<{
      name: string;
      phone: string | null;
      address: string | null;
      text_size: string;
      read_instructions: boolean;
    }>(
      `
      SELECT name, phone, address, text_size, read_instructions
      FROM public.profiles
      WHERE user_id = $1
      FOR UPDATE
      `,
      [userId],
    );

    const current = existing.rows[0];
    if (!current) {
      throw httpErrors.notFound('Tu perfil no existe.');
    }

    if (input.email !== undefined) {
      const duplicate = await tx.query<{ user_id: string }>(
        `SELECT user_id FROM public.auth_credentials WHERE email = $1 AND user_id <> $2`,
        [input.email, userId],
      );
      if (duplicate.rows.length > 0) {
        throw httpErrors.conflict('Ya existe una cuenta registrada con ese correo electrónico.');
      }
      await tx.query(
        `UPDATE public.auth_credentials SET email = $1, updated_at = now() WHERE user_id = $2`,
        [input.email, userId],
      );
    }

    if (input.photoId !== undefined) {
      await tx.query(
        `UPDATE public.fisher_details SET photo_id = $1, updated_at = now() WHERE user_id = $2`,
        [input.photoId, userId],
      );
    }

    await tx.query(
      `
      UPDATE public.profiles
      SET name = $1,
          phone = $2,
          address = $3,
          text_size = $4,
          read_instructions = $5,
          updated_at = now()
      WHERE user_id = $6
      `,
      [
        input.name ?? current.name,
        input.phone ?? current.phone,
        input.address ?? current.address,
        input.textSize ?? current.text_size,
        input.readInstructions ?? current.read_instructions,
        userId,
      ],
    );

    return getMyProfile(userId, tx);
  });
}

export async function changeMyCredentials(
  session: SessionClaims,
  input: ChangeCredentialsInput,
): Promise<AuthSessionResponseDto> {
  requireFreshPasswordAuth(session);

  return withTransaction(async tx => {
    const credRes = await tx.query<{
      user_id: string;
      email: string;
      password_salt: string;
      password_hash: string;
    }>(
      `
      SELECT user_id, email, password_salt, password_hash
      FROM public.auth_credentials
      WHERE user_id = $1
      FOR UPDATE
      `,
      [session.sub],
    );

    const current = credRes.rows[0];
    if (!current) {
      throw httpErrors.notFound('No se encontraron credenciales para esta cuenta.');
    }

    if (
      !verifyPasswordScrypt(
        input.currentPassword,
        current.password_salt,
        current.password_hash,
      )
    ) {
      throw httpErrors.forbidden(
        'La contraseña actual ingresada es incorrecta.',
        'INVALID_CURRENT_PASSWORD',
      );
    }

    const nextEmail = input.newEmail ?? current.email;
    if (nextEmail !== current.email) {
      const duplicate = await tx.query<{ user_id: string }>(
        `SELECT user_id FROM public.auth_credentials WHERE email = $1 AND user_id <> $2`,
        [nextEmail, session.sub],
      );
      if (duplicate.rows.length > 0) {
        throw httpErrors.conflict('Ese correo electrónico ya está en uso por otra cuenta.');
      }
    }

    const nextAuth = input.newPassword
      ? hashPasswordScrypt(input.newPassword)
      : { salt: current.password_salt, hash: current.password_hash };

    await tx.query(
      `
      UPDATE public.auth_credentials
      SET email = $1,
          password_salt = $2,
          password_hash = $3,
          updated_at = now()
      WHERE user_id = $4
      `,
      [nextEmail, nextAuth.salt, nextAuth.hash, session.sub],
    );

    const profile = await getMyProfile(session.sub, tx);
    const nowSec = Math.floor(Date.now() / 1000);
    const token = signSessionJwt({
      sub: profile.userId,
      role: profile.role,
      name: profile.name,
      email: profile.email,
      ...(profile.fisherDetail?.memberCode
        ? { memberCode: profile.fisherDetail.memberCode }
        : {}),
      passwordAuthenticatedAt: nowSec,
    });

    return { token, profile };
  });
}
