-- When a cook makes a dish with substitutions, the allergens can differ from the
-- base recipe. Capture whether they substituted and the allergens of their version.
ALTER TABLE review_instance ADD COLUMN IF NOT EXISTS substituted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE review_instance ADD COLUMN IF NOT EXISTS allergens TEXT[] NOT NULL DEFAULT '{}';
