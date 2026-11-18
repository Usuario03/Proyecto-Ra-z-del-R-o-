-- CUI-T3: retiro público automático al cumplirse 30 minutos con stock cero.
-- No elimina lotes ni toca order_lines/recibos. Ejecutar solo tras revisión,
-- respaldo y autorización operativa explícita para el destino.
BEGIN;

ALTER TABLE public.lots
  ADD COLUMN IF NOT EXISTS out_of_stock_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_hidden_at timestamptz;

-- No inventar un agotamiento histórico: los lotes que ya estaban en cero se
-- retiran de inmediato y conservan su fila e historial.
UPDATE public.lots
SET auto_hidden_at = COALESCE(auto_hidden_at, withdrawn_at, clock_timestamp())
WHERE stock_units = 0
  AND auto_hidden_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lots_exhaustion_state_check'
      AND conrelid = 'public.lots'::regclass
  ) THEN
    ALTER TABLE public.lots
      ADD CONSTRAINT lots_exhaustion_state_check CHECK (
        stock_units > 0 OR out_of_stock_at IS NOT NULL OR auto_hidden_at IS NOT NULL
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lots_expiring_stock
  ON public.lots(out_of_stock_at)
  WHERE stock_units = 0 AND withdrawn_at IS NULL AND auto_hidden_at IS NULL;

CREATE OR REPLACE FUNCTION public.track_lot_stock_exhaustion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  transition_at timestamptz := clock_timestamp();
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.stock_units = 0 THEN
      NEW.out_of_stock_at := COALESCE(NEW.out_of_stock_at, transition_at);
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.stock_units = 0 AND OLD.stock_units > 0 THEN
    NEW.out_of_stock_at := transition_at;
    NEW.auto_hidden_at := OLD.auto_hidden_at;
  ELSIF NEW.stock_units = 0 AND OLD.stock_units = 0 THEN
    NEW.out_of_stock_at := COALESCE(OLD.out_of_stock_at, NEW.out_of_stock_at, transition_at);
    NEW.auto_hidden_at := OLD.auto_hidden_at;
  ELSIF NEW.stock_units > 0 AND OLD.stock_units = 0 THEN
    IF OLD.auto_hidden_at IS NOT NULL
       OR (OLD.out_of_stock_at IS NOT NULL
           AND OLD.out_of_stock_at <= transition_at - interval '30 minutes') THEN
      -- Ya retirado (o vencido aunque el sweep aún no haya corrido):
      -- permanece oculto; se requiere una publicación nueva.
      NEW.auto_hidden_at := COALESCE(OLD.auto_hidden_at, transition_at);
      NEW.out_of_stock_at := OLD.out_of_stock_at;
    ELSE
      -- Reposición antes del límite: cancela la expiración pendiente.
      NEW.out_of_stock_at := NULL;
      NEW.auto_hidden_at := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lots_track_stock_exhaustion ON public.lots;
CREATE TRIGGER lots_track_stock_exhaustion
  BEFORE INSERT OR UPDATE OF stock_units ON public.lots
  FOR EACH ROW
  EXECUTE FUNCTION public.track_lot_stock_exhaustion();

COMMIT;
