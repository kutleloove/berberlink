-- Migration: Move permissions from Staff to StaffRole
-- Yetkileri Staff'tan StaffRole'a taşıyoruz

-- 1. StaffRole tablosuna yetki kolonlarını ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'StaffRole' AND column_name = 'canCreateAppointments') THEN
        ALTER TABLE "StaffRole" ADD COLUMN "canCreateAppointments" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'StaffRole' AND column_name = 'canEditAppointments') THEN
        ALTER TABLE "StaffRole" ADD COLUMN "canEditAppointments" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'StaffRole' AND column_name = 'canManageMessages') THEN
        ALTER TABLE "StaffRole" ADD COLUMN "canManageMessages" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'StaffRole' AND column_name = 'canUpdateProfile') THEN
        ALTER TABLE "StaffRole" ADD COLUMN "canUpdateProfile" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'StaffRole' AND column_name = 'canManageStaff') THEN
        ALTER TABLE "StaffRole" ADD COLUMN "canManageStaff" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- 2. Staff tablosundan yetki kolonlarını kaldır
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Staff' AND column_name = 'canCreateAppointments') THEN
        ALTER TABLE "Staff" DROP COLUMN "canCreateAppointments";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Staff' AND column_name = 'canEditAppointments') THEN
        ALTER TABLE "Staff" DROP COLUMN "canEditAppointments";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Staff' AND column_name = 'canManageMessages') THEN
        ALTER TABLE "Staff" DROP COLUMN "canManageMessages";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Staff' AND column_name = 'canUpdateProfile') THEN
        ALTER TABLE "Staff" DROP COLUMN "canUpdateProfile";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Staff' AND column_name = 'canManageStaff') THEN
        ALTER TABLE "Staff" DROP COLUMN "canManageStaff";
    END IF;
END $$;



