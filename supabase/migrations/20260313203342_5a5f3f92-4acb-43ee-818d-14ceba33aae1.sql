
INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding-files', 'onboarding-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload onboarding files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'onboarding-files');

CREATE POLICY "Anyone can read onboarding files"
ON storage.objects FOR SELECT
USING (bucket_id = 'onboarding-files');

CREATE POLICY "Users can delete own onboarding files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'onboarding-files' AND (storage.foldername(name))[1] = auth.uid()::text);
