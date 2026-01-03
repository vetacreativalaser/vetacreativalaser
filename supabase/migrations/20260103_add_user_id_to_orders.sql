-- Add user_id column to orders table
-- This links the order to the authenticated user who made the purchase
-- Even if the email used in Stripe is different

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Add foreign key constraint to auth.users (drop first if exists)
-- Using ON DELETE SET NULL to keep order history even if user is deleted
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_user_id'
    ) THEN
        ALTER TABLE orders
        ADD CONSTRAINT fk_orders_user_id
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Update RLS policy to also check user_id
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

-- Policy: Users can view their own orders (by user_id OR email)
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    customer_email = auth.jwt() ->> 'email'
  );

-- Add comment
COMMENT ON COLUMN orders.user_id IS 'ID of the authenticated user who placed the order (may differ from customer_email)';
