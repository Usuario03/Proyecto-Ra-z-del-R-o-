-- PROPUESTA PARA SPEC 003. NO APLICAR EN REMOTO SIN PERMISO OPERATIVO.
-- Idempotente para columnas, restricciones, índices y trigger.
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_account_status_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_status_check
      CHECK (account_status IN ('active','inactive','suspended','deleted'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_deleted_by_fkey') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES public.profiles(user_id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_deleted_state_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_deleted_state_check CHECK (
      (account_status = 'deleted' AND deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
      OR (account_status <> 'deleted' AND deleted_at IS NULL AND deleted_by IS NULL)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role_status_created
  ON public.profiles(role, account_status, created_at DESC, user_id DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login
  ON public.profiles(last_login_at DESC) WHERE last_login_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fisher_details_port ON public.fisher_details(port);
CREATE UNIQUE INDEX IF NOT EXISTS uq_fisher_details_document
  ON public.fisher_details(document) WHERE document IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.admin_account_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE RESTRICT,
  target_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN (
    'created','updated','password_reset','deactivated','suspended',
    'reactivated','soft_deleted','restored'
  )),
  before_state jsonb,
  after_state jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_account_audit_occurred
  ON public.admin_account_audit(occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_admin_account_audit_target
  ON public.admin_account_audit(target_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_account_audit_actor
  ON public.admin_account_audit(actor_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION public.reject_admin_account_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'admin account audit is append-only' USING ERRCODE = '55000';
END;
$$;
DROP TRIGGER IF EXISTS admin_account_audit_immutable ON public.admin_account_audit;
CREATE TRIGGER admin_account_audit_immutable
  BEFORE UPDATE OR DELETE ON public.admin_account_audit
  FOR EACH ROW EXECUTE FUNCTION public.reject_admin_account_audit_mutation();

COMMIT;
