import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present (len ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'missing';
  const envService = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present (len ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'missing';

  let supabaseTest: any = null;
  let supabaseError: any = null;

  if (supabase) {
    const { data, error } = await supabase.from('employees').select('*');
    supabaseTest = data;
    supabaseError = error;
  }

  return NextResponse.json({
    isSupabaseConfigured,
    envUrl,
    envAnon,
    envService,
    supabaseTest,
    supabaseError,
  });
}
