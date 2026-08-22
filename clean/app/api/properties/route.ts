import { NextResponse } from 'next/server';
import { getProperties } from '@/lib/db';
import { stats } from '@/lib/data';
export async function GET(){const rows=await getProperties();return NextResponse.json({ok:true,rows,stats:stats(rows)});}
