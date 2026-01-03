-- Create function to get orders with user information
-- This is needed because we can't directly JOIN with auth.users from the client

CREATE OR REPLACE FUNCTION get_orders_with_user_info()
RETURNS TABLE (
  -- Order fields
  id BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  order_number TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  user_id UUID,
  customer_email TEXT,
  customer_name TEXT,
  shipping_address JSONB,
  billing_address JSONB,
  items JSONB,
  subtotal NUMERIC,
  shipping_cost NUMERIC,
  total NUMERIC,
  total_weight NUMERIC,
  status TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  admin_notes TEXT,
  paid_at TIMESTAMPTZ,
  producing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- User fields (from auth.users metadata)
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.created_at,
    o.updated_at,
    o.order_number,
    o.stripe_session_id,
    o.stripe_payment_intent_id,
    o.user_id,
    o.customer_email,
    o.customer_name,
    o.shipping_address,
    o.billing_address,
    o.items,
    o.subtotal,
    o.shipping_cost,
    o.total,
    o.total_weight,
    o.status,
    o.tracking_number,
    o.shipped_at,
    o.admin_notes,
    o.paid_at,
    o.producing_started_at,
    o.completed_at,
    -- Extract user info from auth.users raw_user_meta_data
    (u.raw_user_meta_data->>'name')::TEXT as user_name,
    u.email::TEXT as user_email,
    (u.raw_user_meta_data->>'phone')::TEXT as user_phone
  FROM orders o
  LEFT JOIN auth.users u ON o.user_id = u.id
  ORDER BY o.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_orders_with_user_info() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_orders_with_user_info() IS 'Returns all orders with associated user information from auth.users. Used by admin dashboard.';
