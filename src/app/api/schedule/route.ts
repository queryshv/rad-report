export const dynamic = 'force-static';
export const revalidate = false;

import { NextResponse } from 'next/server';
import scheduleData from '@/data/operator_schedule.json';

export async function GET() {
  return NextResponse.json(scheduleData);
}

// Note: POST requests are not supported in static exports
export async function POST() {
  return NextResponse.json(
    { message: 'This endpoint is not available in static export' },
    { status: 405 }
  );
}