import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    '';
  const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA?.trim() || 'autoscript';

  const isConfigured =
    Boolean(url && key) &&
    !url.includes('your-project-id.supabase.co') &&
    !key.includes('your-anon-key-here');

  return { url, key, schema, isConfigured };
}

export async function GET() {
  const { url, key, schema, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return NextResponse.json(
      {
        error: 'กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ในไฟล์ .env.local',
      },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(url, key);

    const { data, error } = await supabase
      .schema(schema)
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          hint:
            error.code === 'PGRST106'
              ? `กรุณาไปที่ Supabase Dashboard -> Project Settings -> API -> Exposed schemas แล้วเพิ่ม "${schema}" เข้าไปในรายการ`
              : error.hint || null,
        },
        { status: 400 }
      );
    }

    const normalized = (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      amount: row.amount !== null && row.amount !== undefined ? Number(row.amount) : 0,
    }));

    return NextResponse.json({
      schema,
      data: normalized,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error connecting to Supabase';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { url, key, schema, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return NextResponse.json(
      { error: 'กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ในไฟล์ .env.local' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const items = Array.isArray(body.transactions) ? body.transactions : [body];

    const rowsToInsert = items.map((item: Record<string, unknown>) => ({
      type: item.type === 'income' ? 'income' : 'expense',
      amount: Number(item.amount) || 0,
      description: item.description ? String(item.description) : null,
      transaction_date: item.transaction_date
        ? new Date(String(item.transaction_date)).toISOString()
        : new Date().toISOString(),
      bank: item.bank ? String(item.bank) : null,
      email_id: item.email_id ? String(item.email_id) : null,
      raw_body: item.raw_body ? String(item.raw_body) : null,
    }));

    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .schema(schema)
      .from('transactions')
      .insert(rowsToInsert)
      .select('*');

    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.code, hint: error.hint },
        { status: 400 }
      );
    }

    const normalized = (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      amount: row.amount !== null && row.amount !== undefined ? Number(row.amount) : 0,
    }));

    return NextResponse.json({ success: true, data: normalized });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to insert transaction';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { url, key, schema, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return NextResponse.json(
      { error: 'กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ในไฟล์ .env.local' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
    }

    const supabase = createClient(url, key);
    const { error } = await supabase
      .schema(schema)
      .from('transactions')
      .delete()
      .eq('id', Number(id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete transaction';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
