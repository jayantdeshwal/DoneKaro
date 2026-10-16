SELECT 
    p.id, 
    p.role, 
    p.full_name,
    p.phone,
    u.email,
    p.created_at,
    (p.id = '3216cdd3-aaea-45ab-944c-cfb30d6a6e0b') AS is_authoritative_super_admin
FROM public.profiles p
JOIN auth.users u ON p.id = u.id;
