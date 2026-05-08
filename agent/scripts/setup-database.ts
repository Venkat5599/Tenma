/**
 * Database Setup Script
 * Run this to set up Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...\n');

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('📄 Schema file loaded');
    console.log('⚠️  Note: You need to run this SQL manually in Supabase SQL Editor');
    console.log('   Go to: https://supabase.com/dashboard → SQL Editor\n');
    console.log('📋 Copy this SQL:\n');
    console.log('─'.repeat(80));
    console.log(schema);
    console.log('─'.repeat(80));
    console.log('\n✅ After running the SQL, your database will be ready!');

    // Test connection
    console.log('\n🔍 Testing database connection...');
    const { data, error } = await supabase.from('user_profiles').select('count');
    
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('⚠️  Tables not created yet. Please run the SQL above.');
      } else {
        console.error('❌ Database error:', error.message);
      }
    } else {
      console.log('✅ Database connection successful!');
      console.log('✅ Tables are ready!');
    }
  } catch (error: any) {
    console.error('❌ Setup error:', error.message);
    process.exit(1);
  }
}

setupDatabase();
