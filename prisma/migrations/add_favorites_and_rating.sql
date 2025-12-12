-- Migration: Add Favorites and Rating System
-- This migration adds the Favorite model and averageRating field to Profile

-- 1. Add averageRating column to Profile table
ALTER TABLE "Profile" 
ADD COLUMN IF NOT EXISTS "averageRating" DOUBLE PRECISION;

-- 2. Create Favorite table
CREATE TABLE IF NOT EXISTS "Favorite" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- 3. Add foreign key constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Favorite_customerId_fkey'
    ) THEN
        ALTER TABLE "Favorite" 
        ADD CONSTRAINT "Favorite_customerId_fkey" 
        FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Favorite_barberId_fkey'
    ) THEN
        ALTER TABLE "Favorite" 
        ADD CONSTRAINT "Favorite_barberId_fkey" 
        FOREIGN KEY ("barberId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. Create unique constraint for customerId and barberId combination
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_customerId_barberId_key" 
ON "Favorite"("customerId", "barberId");

-- 5. Create index for faster queries
CREATE INDEX IF NOT EXISTS "Favorite_customerId_idx" ON "Favorite"("customerId");
CREATE INDEX IF NOT EXISTS "Favorite_barberId_idx" ON "Favorite"("barberId");

