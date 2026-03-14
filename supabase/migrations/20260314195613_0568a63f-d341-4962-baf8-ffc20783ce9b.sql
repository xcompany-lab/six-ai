INSERT INTO public.user_roles (user_id, role) VALUES
('3f4edeb2-7ced-45d0-9950-88e2b9840711', 'admin'),
('7a510b43-eec1-48df-9b45-85797564e481', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;