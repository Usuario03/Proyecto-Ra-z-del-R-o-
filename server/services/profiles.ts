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
  if (input.role !== 'client') throw httpErrors.forbidden('El registro público solo permite clientes.');
  const profile = await createAccount({ ...input, role: 'client' });
  return { profile, mustChangePassword:false, token: signSessionJwt({
    sub: profile.userId, role: profile.role, name: profile.name, email: profile.email,
    passwordAuthenticatedAt: Math.floor(Date.now() / 1000),
  }) };
}

export async function createFisherAccount(session: SessionClaims, input: OnboardingInput): Promise<UserProfileDto> {
  const actor=await getDbPool().query<{role:string;account_status:string}>('SELECT role,account_status FROM public.profiles WHERE user_id=$1',[session.sub]);
  if (session.role !== 'admin' || actor.rows[0]?.role !== 'admin'||actor.rows[0]?.account_status!=='active') {
    throw httpErrors.forbidden('Solo administración puede crear cuentas de pescadores.');
  }
  return createAccount({ ...input, role: 'fisher' },session.sub);
}

async function createAccount(input: OnboardingInput,createdByAdmin?:string): Promise<UserProfileDto> {
  const { salt, hash } = hashPasswordScrypt(input.password);

  try {
  return await withTransaction(async tx => {
    const emailExisting = await tx.query<{ user_id: string }>(
      `SELECT user_id FROM public.auth_credentials WHERE email = $1 FOR UPDATE`,
      [input.email],
    );
    if (emailExisting.rows.length > 0) {
      throw httpErrors.conflict('Ese correo ya tiene una cuenta registrada.');
    }

    if (input.role === 'fisher' && input.document) {
      const docExisting = await tx.query<{ user_id: string }>(
        `SELECT user_id FROM public.fisher_details WHERE document = $1 FOR UPDATE`,
        [input.document],
      );
      if (docExisting.rows.length > 0) {
        throw httpErrors.conflict('Ya existe una solicitud registrada con esa cédula.');
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
      ) VALUES ($1, $2, $3, $4, $5, $6, false, 'normal', false)
      `,
      [
        userId,
        input.role,
        input.name,
        input.phone ?? null,
        input.address ?? null,
        Boolean(createdByAdmin),
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
      memberCode = `FP-${userId}`;
      const safeNickname = input.nickname?.trim() || input.name.trim().split(/\s+/)[0] || input.name.trim();
      const safeDoc = input.document?.trim() || null;
      const safePort = input.port?.trim() || 'Muelle de Barrancabermeja';
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
        [userId, safeNickname, safeDoc, safePort, memberCode],
      );
    }

    const profile = await getMyProfile(userId, tx);
    if(createdByAdmin)await tx.query(
      `INSERT INTO public.admin_account_audit(actor_id,target_user_id,action,before_state,after_state)
       VALUES($1,$2,'created',NULL,$3::jsonb)`,
      [createdByAdmin,userId,JSON.stringify({name:profile.name,email:profile.email,role:'fisher',firstLoginRequired:true})]);
    return profile;
  });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      throw httpErrors.conflict('El correo o el documento ya está registrado.');
    }
    throw error;
  }
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
    throw httpErrors.unauthorized('El correo o la contraseña no coinciden.');
  }

  const profile = await getMyProfile(cred.user_id, db);
  if (!verifyPasswordScrypt(input.password, cred.password_salt, cred.password_hash)) {
    throw httpErrors.unauthorized('El correo o la contraseña no coinciden.');
  }

  const account=await db.query<{account_status:string;first_login_required:boolean}>(
    `UPDATE public.profiles SET last_login_at=now() WHERE user_id=$1 AND account_status='active' RETURNING account_status,first_login_required`,
    [profile.userId]);
  if(!account.rows[0])throw httpErrors.unauthorized('Esta cuenta no está activa. Comunícate con administración.');
  const mustChangePassword=account.rows[0].first_login_required;
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
    ...(mustChangePassword?{mustChangePassword:true}:{}),
  });

  return { token, profile, mustChangePassword };
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
        throw httpErrors.conflict('Ese correo ya tiene una cuenta registrada.');
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
  if(session.mustChangePassword&&!input.newPassword)throw httpErrors.validation('Debes establecer una contraseña nueva para continuar.');

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
    if(session.mustChangePassword)await tx.query(
      'UPDATE public.profiles SET first_login_required=false,updated_at=now() WHERE user_id=$1',[session.sub]);

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

    return { token, profile, mustChangePassword:false };
  });
}
