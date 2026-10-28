-- Synthetic local/QA fixtures. Production pushes must omit --include-seed.
insert into public.properties (
  slug, address, location, neighborhood, property_type,
  price, beds, baths, sqft, illustration, listing_status, published
) values (
  'qa-fictional-home-001', '[QA] 100 Fictional Lane',
  'Fictional QA location', 'QA Neighborhood', 'Single-family',
  350000, 3, 2, 1800, 'brick', 'For Sale', false
) on conflict (slug) do nothing;
