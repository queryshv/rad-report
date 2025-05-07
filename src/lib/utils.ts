import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";
import { km } from 'date-fns/locale'; // Import Khmer locale

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: Date): string => {
  return format(date, "dd/MM/yyyy");
};

const khmerDayMap: { [key: string]: string } = {
  'Sunday': 'ថ្ងៃអាទិត្យ',
  'Monday': 'ថ្ងៃច័ន្ទ',
  'Tuesday': 'ថ្ងៃអង្គារ',
  'Wednesday': 'ថ្ងៃពុធ',
  'Thursday': 'ថ្ងៃព្រហស្បតិ៍',
  'Friday': 'ថ្ងៃសុក្រ',
  'Saturday': 'ថ្ងៃសៅរ៍',
};

export const formatDateWithKhmerDay = (date: Date): string => {
  const datePart = format(date, "dd/MM/yyyy");
  // Get English day name to map to Khmer, as date-fns Khmer locale might not give the exact desired word for "day"
  const englishDayName = format(date, "EEEE"); // e.g., "Tuesday"
  const khmerDayName = khmerDayMap[englishDayName] || format(date, "EEEE", { locale: km }); // Fallback to locale's day name if map fails
  
  return `${datePart} (${khmerDayName})`;
};


export const parseMmDdYy = (dateStr: string): Date => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const yearSuffix = parseInt(parts[2], 10);
    // Assuming years are 20xx
    return new Date(2000 + yearSuffix, month - 1, day);
  }
  // Fallback for invalid format, though input should be controlled
  return new Date(dateStr); 
};
