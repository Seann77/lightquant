ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharge_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_task_results ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  role_name text;
  table_name text;
  table_names text[] := ARRAY[
    'users',
    'sms_codes',
    'credit_accounts',
    'credit_ledger',
    'credit_reservations',
    'recharge_plans',
    'orders',
    'payment_transactions',
    'ai_tasks',
    'ai_task_results'
  ];
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      FOREACH table_name IN ARRAY table_names
      LOOP
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, role_name);
      END LOOP;
    END IF;
  END LOOP;
END $$;
