-- Add idempotency_key column for duplicate order prevention
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;

-- Index for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_idx
ON public.orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Fix push_subscriptions: use user_id instead of order_id for durable subscriptions
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Remove the old order_id column (optional, kept as nullable for backward compatibility)
-- ALTER TABLE public.push_subscriptions DROP COLUMN IF EXISTS order_id;

-- New conflict target
DROP INDEX IF EXISTS push_subscriptions_order_id_endpoint_idx;
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_user_id_endpoint_idx
ON public.push_subscriptions (user_id, endpoint)
WHERE user_id IS NOT NULL;
