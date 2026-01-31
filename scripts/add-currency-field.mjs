import { config } from "dotenv";
import { db } from "../db/index.js";
import { sql } from "drizzle-orm";

// Load environment variables
config({ path: '.env.local' });

async function addCurrencyField() {
    try {
        console.log("Adding currency field to transactions table...");
        
        // Add currency field if it doesn't exist
        await db.execute(sql`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='transaction' AND column_name='currency'
                ) THEN
                    ALTER TABLE "transaction" ADD COLUMN "currency" varchar(3) DEFAULT 'NGN';
                    RAISE NOTICE 'Added currency column to transaction table';
                ELSE
                    RAISE NOTICE 'Currency column already exists';
                END IF;
            END $$;
        `);
        
        // Update existing transactions to have currency based on linked debt or default to NGN
        await db.execute(sql`
            UPDATE "transaction" 
            SET currency = COALESCE(
                (SELECT d.currency FROM debt d WHERE d.id = "transaction".debt_id), 
                'NGN'
            )
            WHERE currency IS NULL OR currency = '';
        `);
        
        // Make currency field NOT NULL after setting defaults  
        await db.execute(sql`
            ALTER TABLE "transaction" ALTER COLUMN "currency" SET NOT NULL;
        `);
        
        console.log("✓ Successfully added currency field to transactions table");
        process.exit(0);
    } catch (error) {
        console.error("Error adding currency field:", error);
        process.exit(1);
    }
}

addCurrencyField();