-- Create orders table for managing customer orders
-- Includes full order lifecycle from payment to shipping

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Order identification
  order_number TEXT UNIQUE NOT NULL, -- Formato: VCL-2024-00001
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,

  -- Customer information (from Stripe)
  customer_email TEXT NOT NULL,
  customer_name TEXT,

  -- Shipping address (JSON from Stripe)
  shipping_address JSONB NOT NULL,
  billing_address JSONB,

  -- Order details
  items JSONB NOT NULL, -- Array of cart items with customization
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping_cost NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  total_weight NUMERIC(10, 2), -- En kg

  -- Order status workflow
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'producing', 'completed', 'shipped', 'cancelled')),

  -- Shipping information
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,

  -- Admin notes
  admin_notes TEXT,

  -- Timestamps for status changes
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  producing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create index on order_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Create index on customer_email for customer order history
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- Create index on status for admin filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  order_num TEXT;
BEGIN
  -- Get current year (last 2 digits)
  year_suffix := TO_CHAR(NOW(), 'YY');

  -- Get next sequential number for this year
  SELECT COALESCE(MAX(
    CASE
      WHEN order_number LIKE 'VCL-' || year_suffix || '-%'
      THEN CAST(SUBSTRING(order_number FROM 9) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1 INTO next_number
  FROM orders;

  -- Format: VCL-YY-NNNNN
  order_num := 'VCL-' || year_suffix || '-' || LPAD(next_number::TEXT, 5, '0');

  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create function to update status timestamps
CREATE OR REPLACE FUNCTION update_order_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Update producing_started_at when status changes to producing
  IF NEW.status = 'producing' AND OLD.status != 'producing' THEN
    NEW.producing_started_at = NOW();
  END IF;

  -- Update completed_at when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;

  -- Update shipped_at when status changes to shipped
  IF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
    NEW.shipped_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status timestamp updates
DROP TRIGGER IF EXISTS trigger_order_status_timestamps ON orders;
CREATE TRIGGER trigger_order_status_timestamps
  BEFORE UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_order_status_timestamps();

-- Add RLS (Row Level Security) policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
CREATE POLICY "Admins can manage all orders"
  ON orders
  FOR ALL
  USING (auth.jwt() ->> 'email' = 'vetacreativalaser@gmail.com');

-- Policy: Users can view their own orders
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  USING (customer_email = auth.jwt() ->> 'email');

-- Add comment to table
COMMENT ON TABLE orders IS 'Stores all customer orders with full lifecycle tracking from payment to shipping';
COMMENT ON COLUMN orders.status IS 'Order status: paid -> producing -> completed -> shipped (or cancelled)';
COMMENT ON COLUMN orders.items IS 'JSONB array containing product details, customization, and pricing';
