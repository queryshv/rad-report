'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Path to the JSON file
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const dataFilePath = path.join(dataDirectory, 'operator_schedule.json');

const OperatorScheduleSchema = z.record(z.string().min(1,"Operator name cannot be empty")); // Record<string, string>
type OperatorSchedule = z.infer<typeof OperatorScheduleSchema>;

// Ensure data directory exists
async function ensureDataDirectoryExists() {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Failed to create data directory:', error);
    // This is a critical error, should probably throw or handle appropriately
  }
}

async function readSchedule(): Promise<OperatorSchedule> {
  await ensureDataDirectoryExists();
  try {
    const fileData = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(fileData) as OperatorSchedule;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty schedule and create the file
      await writeSchedule({}); // Create an empty file
      return {};
    }
    console.error('Failed to read schedule data from file:', dataFilePath, error);
    throw new Error('Failed to read schedule data.');
  }
}

async function writeSchedule(data: OperatorSchedule): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(dataFilePath, jsonData, 'utf-8');
  } catch (error) {
    console.error('Failed to write schedule data to file:', dataFilePath, error);
    throw new Error('Failed to write schedule data.');
  }
}

export async function GET(request: NextRequest) {
  try {
    const schedule = await readSchedule();
    return NextResponse.json(schedule);
  } catch (error: any) {
    console.error('[API GET /api/schedule] Error:', error);
    return NextResponse.json({ message: error.message || 'Failed to retrieve schedule' }, { status: 500 });
  }
}

const UpsertScheduleEntrySchema = z.object({
    date: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-(\d{2})$/, "Date must be in MM-DD-YY format"),
    operator: z.string().min(1, "Operator name cannot be empty"),
});

const UpsertScheduleArraySchema = z.array(UpsertScheduleEntrySchema);


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let newScheduleData: OperatorSchedule;

    if (Array.isArray(body)) {
      // This is for appending/updating entries from Excel upload
      const parsedEntries = UpsertScheduleArraySchema.safeParse(body);
      if (!parsedEntries.success) {
        console.error('[API POST /api/schedule] Invalid array format:', parsedEntries.error.format());
        return NextResponse.json({ message: 'Invalid schedule entry array format', errors: parsedEntries.error.format() }, { status: 400 });
      }
      
      const currentSchedule = await readSchedule();
      parsedEntries.data.forEach(entry => {
        currentSchedule[entry.date] = entry.operator; // Upsert logic
      });
      newScheduleData = currentSchedule;

    } else {
      // This is for saving the entire schedule object (e.g., after client-side edit/delete)
       const parsedSchedule = OperatorScheduleSchema.safeParse(body);
        if (!parsedSchedule.success) {
            console.error('[API POST /api/schedule] Invalid full schedule object format:', parsedSchedule.error.format());
            return NextResponse.json({ message: 'Invalid full schedule object format', errors: parsedSchedule.error.format() }, { status: 400 });
        }
        newScheduleData = parsedSchedule.data;
    }

    await writeSchedule(newScheduleData);
    return NextResponse.json({ message: 'Schedule updated successfully' });
  } catch (error: any) {
    console.error('[API POST /api/schedule] Error:', error);
    return NextResponse.json({ message: error.message || 'Failed to update schedule' }, { status: 500 });
  }
}