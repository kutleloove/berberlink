-- Migration: Add multi-shift support
-- This migration adds the Shift model and updates WorkingHour

-- 1. Create Shift table
CREATE TABLE IF NOT EXISTS "Shift" (
    "id" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "workingHourId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- 2. Add createdAt and updatedAt to WorkingHour if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'WorkingHour' AND column_name = 'createdAt') THEN
        ALTER TABLE "WorkingHour" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'WorkingHour' AND column_name = 'updatedAt') THEN
        ALTER TABLE "WorkingHour" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 3. Remove old startTime and endTime columns from WorkingHour (if they exist)
-- First, migrate existing data to Shift table if needed
DO $$
DECLARE
    wh_record RECORD;
    shift_id TEXT;
BEGIN
    -- For each WorkingHour that has startTime and endTime, create a Shift
    FOR wh_record IN 
        SELECT id, "startTime", "endTime", "profileId", "dayOfWeek"
        FROM "WorkingHour"
        WHERE "startTime" IS NOT NULL 
          AND "endTime" IS NOT NULL
          AND "isClosed" = false
    LOOP
        -- Generate a unique ID for the shift
        shift_id := gen_random_uuid()::TEXT;
        
        -- Insert into Shift table
        INSERT INTO "Shift" ("id", "startTime", "endTime", "workingHourId", "createdAt")
        VALUES (shift_id, wh_record."startTime", wh_record."endTime", wh_record.id, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- 4. Drop old columns (commented out for safety - uncomment after verifying data migration)
-- ALTER TABLE "WorkingHour" DROP COLUMN IF EXISTS "startTime";
-- ALTER TABLE "WorkingHour" DROP COLUMN IF EXISTS "endTime";

-- 5. Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Shift_workingHourId_fkey'
    ) THEN
        ALTER TABLE "Shift" 
        ADD CONSTRAINT "Shift_workingHourId_fkey" 
        FOREIGN KEY ("workingHourId") 
        REFERENCES "WorkingHour"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- 6. Create index for better performance
CREATE INDEX IF NOT EXISTS "Shift_workingHourId_idx" ON "Shift"("workingHourId");

