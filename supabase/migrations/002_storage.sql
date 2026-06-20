-- ============================================================
-- DOKAN — Supabase Storage Buckets Setup
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'menu-images',
    'menu-images',
    true,
    5242880,  -- 5MB limit
    ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
  ),
  (
    'restaurant-assets',
    'restaurant-assets',
    true,
    5242880,
    ARRAY['image/jpeg','image/jpg','image/png','image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Anyone can read public images
CREATE POLICY "Public read menu images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

CREATE POLICY "Public read restaurant assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'restaurant-assets');

-- Authenticated users can upload/delete their own images
CREATE POLICY "Authenticated upload menu images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'menu-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated upload restaurant assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'restaurant-assets'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated delete own menu images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'menu-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated delete own restaurant assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'restaurant-assets'
    AND auth.role() = 'authenticated'
  );
