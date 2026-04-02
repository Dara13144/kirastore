
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Allow public read access
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');

-- Allow authenticated uploads (we'll use service role from edge function, but also allow anon for flexibility)
CREATE POLICY "Allow uploads to product images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'product-images');

-- Allow updates
CREATE POLICY "Allow updates to product images" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'product-images');

-- Allow deletes
CREATE POLICY "Allow deletes from product images" ON storage.objects FOR DELETE TO public USING (bucket_id = 'product-images');
