-- ============================================================================
-- Migration: 202611100004_update_is_admin_function.sql
-- Description: Update public.is_admin() to recognize role = 'admin' and admin_roles table
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    LEFT JOIN public.admin_roles ar ON ar.user_id = p.id
    WHERE p.id = auth.uid() 
      AND (
        p.role IN ('super_admin', 'sub_admin', 'admin')
        OR ar.access_level IN ('super_admin', 'admin')
      )
  );
$function$;

