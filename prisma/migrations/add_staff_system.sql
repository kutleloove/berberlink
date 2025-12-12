-- Migration: Add Staff and Appointment Management System
-- This migration adds staff management, roles, and appointment reassignment features

-- 1. Create StaffRole table
CREATE TABLE IF NOT EXISTS "StaffRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffRole_pkey" PRIMARY KEY ("id")
);

-- 2. Create Staff table
CREATE TABLE IF NOT EXISTS "Staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "profileId" TEXT NOT NULL,
    "roleId" TEXT,
    "canCreateAppointments" BOOLEAN NOT NULL DEFAULT false,
    "canEditAppointments" BOOLEAN NOT NULL DEFAULT false,
    "canManageMessages" BOOLEAN NOT NULL DEFAULT false,
    "canUpdateProfile" BOOLEAN NOT NULL DEFAULT false,
    "canManageStaff" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- 3. Create StaffWorkingHour table
CREATE TABLE IF NOT EXISTS "StaffWorkingHour" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "staffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffWorkingHour_pkey" PRIMARY KEY ("id")
);

-- 4. Create StaffShift table
CREATE TABLE IF NOT EXISTS "StaffShift" (
    "id" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "staffWorkingHourId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffShift_pkey" PRIMARY KEY ("id")
);

-- 5. Create StaffBreak table
CREATE TABLE IF NOT EXISTS "StaffBreak" (
    "id" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "staffId" TEXT NOT NULL,
    CONSTRAINT "StaffBreak_pkey" PRIMARY KEY ("id")
);

-- 6. Create StaffServiceAssignment table
CREATE TABLE IF NOT EXISTS "StaffServiceAssignment" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffServiceAssignment_pkey" PRIMARY KEY ("id")
);

-- 7. Create AppointmentChange table
CREATE TABLE IF NOT EXISTS "AppointmentChange" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "newStartTime" TIMESTAMP(3) NOT NULL,
    "newEndTime" TIMESTAMP(3) NOT NULL,
    "newStaffId" TEXT,
    "reason" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppointmentChange_pkey" PRIMARY KEY ("id")
);

-- 8. Add staffId and pendingChangeId to Appointment
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Appointment' AND column_name = 'staffId') THEN
        ALTER TABLE "Appointment" ADD COLUMN "staffId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Appointment' AND column_name = 'pendingChangeId') THEN
        ALTER TABLE "Appointment" ADD COLUMN "pendingChangeId" TEXT;
    END IF;
    
    -- Update default status to CONFIRMED
    ALTER TABLE "Appointment" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';
END $$;

-- 9. Add foreign keys
DO $$
BEGIN
    -- StaffRole -> Profile
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'StaffRole_profileId_fkey'
    ) THEN
        ALTER TABLE "StaffRole" 
        ADD CONSTRAINT "StaffRole_profileId_fkey" 
        FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Staff -> Profile
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Staff_profileId_fkey'
    ) THEN
        ALTER TABLE "Staff" 
        ADD CONSTRAINT "Staff_profileId_fkey" 
        FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Staff -> StaffRole
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Staff_roleId_fkey'
    ) THEN
        ALTER TABLE "Staff" 
        ADD CONSTRAINT "Staff_roleId_fkey" 
        FOREIGN KEY ("roleId") REFERENCES "StaffRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- StaffWorkingHour -> Staff
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'StaffWorkingHour_staffId_fkey'
    ) THEN
        ALTER TABLE "StaffWorkingHour" 
        ADD CONSTRAINT "StaffWorkingHour_staffId_fkey" 
        FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- StaffShift -> StaffWorkingHour
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'StaffShift_staffWorkingHourId_fkey'
    ) THEN
        ALTER TABLE "StaffShift" 
        ADD CONSTRAINT "StaffShift_staffWorkingHourId_fkey" 
        FOREIGN KEY ("staffWorkingHourId") REFERENCES "StaffWorkingHour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- StaffBreak -> Staff
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'StaffBreak_staffId_fkey'
    ) THEN
        ALTER TABLE "StaffBreak" 
        ADD CONSTRAINT "StaffBreak_staffId_fkey" 
        FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- StaffServiceAssignment -> Staff
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'StaffServiceAssignment_staffId_fkey'
    ) THEN
        ALTER TABLE "StaffServiceAssignment" 
        ADD CONSTRAINT "StaffServiceAssignment_staffId_fkey" 
        FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- StaffServiceAssignment -> Service
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'StaffServiceAssignment_serviceId_fkey'
    ) THEN
        ALTER TABLE "StaffServiceAssignment" 
        ADD CONSTRAINT "StaffServiceAssignment_serviceId_fkey" 
        FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Appointment -> Staff
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Appointment_staffId_fkey'
    ) THEN
        ALTER TABLE "Appointment" 
        ADD CONSTRAINT "Appointment_staffId_fkey" 
        FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- AppointmentChange -> Appointment
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'AppointmentChange_appointmentId_fkey'
    ) THEN
        ALTER TABLE "AppointmentChange" 
        ADD CONSTRAINT "AppointmentChange_appointmentId_fkey" 
        FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 10. Create unique constraints
DO $$
BEGIN
    -- StaffWorkingHour unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'StaffWorkingHour_staffId_dayOfWeek_key'
    ) THEN
        ALTER TABLE "StaffWorkingHour" 
        ADD CONSTRAINT "StaffWorkingHour_staffId_dayOfWeek_key" UNIQUE ("staffId", "dayOfWeek");
    END IF;

    -- StaffServiceAssignment unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'StaffServiceAssignment_staffId_serviceId_key'
    ) THEN
        ALTER TABLE "StaffServiceAssignment" 
        ADD CONSTRAINT "StaffServiceAssignment_staffId_serviceId_key" UNIQUE ("staffId", "serviceId");
    END IF;

    -- AppointmentChange unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AppointmentChange_appointmentId_key'
    ) THEN
        ALTER TABLE "AppointmentChange" 
        ADD CONSTRAINT "AppointmentChange_appointmentId_key" UNIQUE ("appointmentId");
    END IF;

    -- Appointment pendingChangeId unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_pendingChangeId_key'
    ) THEN
        ALTER TABLE "Appointment" 
        ADD CONSTRAINT "Appointment_pendingChangeId_key" UNIQUE ("pendingChangeId");
    END IF;
END $$;

-- 11. Create indexes
CREATE INDEX IF NOT EXISTS "Staff_profileId_idx" ON "Staff"("profileId");
CREATE INDEX IF NOT EXISTS "Staff_roleId_idx" ON "Staff"("roleId");
CREATE INDEX IF NOT EXISTS "StaffWorkingHour_staffId_idx" ON "StaffWorkingHour"("staffId");
CREATE INDEX IF NOT EXISTS "StaffShift_staffWorkingHourId_idx" ON "StaffShift"("staffWorkingHourId");
CREATE INDEX IF NOT EXISTS "StaffBreak_staffId_idx" ON "StaffBreak"("staffId");
CREATE INDEX IF NOT EXISTS "StaffServiceAssignment_staffId_idx" ON "StaffServiceAssignment"("staffId");
CREATE INDEX IF NOT EXISTS "StaffServiceAssignment_serviceId_idx" ON "StaffServiceAssignment"("serviceId");
CREATE INDEX IF NOT EXISTS "Appointment_staffId_idx" ON "Appointment"("staffId");

