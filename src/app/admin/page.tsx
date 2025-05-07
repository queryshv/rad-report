
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parse } from 'date-fns';
import { km } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import * as XLSX from 'xlsx';
import { parseMmDdYy, cn } from '@/lib/utils';
import { Edit2, Trash2, FileDown, UploadCloud, CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


interface OperatorSchedule {
  [date: string]: string; // date string (MM-DD-YY) => operator name
}

interface ScheduleEntry {
  date: string; // MM-DD-YY
  operator: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [operatorSchedule, setOperatorSchedule] = useState<OperatorSchedule>({});
  const [scheduleForTable, setScheduleForTable] = useState<ScheduleEntry[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingEntry, setCurrentEditingEntry] = useState<ScheduleEntry | null>(null);
  const [editedDateString, setEditedDateString] = useState(''); // MM-DD-YY format
  const [editedOperatorName, setEditedOperatorName] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);


  // Delete Alert State
  const [entryToDelete, setEntryToDelete] = useState<ScheduleEntry | null>(null);


  const loadSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/schedule');
      if (!response.ok) {
        throw new Error(`Failed to fetch schedule: ${response.statusText}`);
      }
      const data: OperatorSchedule = await response.json();
      
      setOperatorSchedule(data);
      const tableData: ScheduleEntry[] = Object.entries(data)
          .map(([date, operator]) => ({ date, operator }))
          .sort((a, b) => parseMmDdYy(a.date).getTime() - parseMmDdYy(b.date).getTime());
      setScheduleForTable(tableData);

    } catch (error) {
      console.error("Error loading operator schedule:", error);
      toast({
        variant: "destructive",
        title: "ប្រតិបត្តិការបរាជ័យ",
        description: "Failed to load operator schedule. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const checkAdminStatus = () => {
      const adminStatus = localStorage.getItem('admin');
      if (adminStatus === 'true') {
        setIsAdmin(true);
        loadSchedule();
      } else {
        setIsAdmin(false);
        router.push('/login');
      }
    };
    checkAdminStatus();
  }, [router, loadSchedule]);


  const persistSchedule = async (updatedSchedule: OperatorSchedule) => {
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSchedule),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save schedule changes');
      }
      toast({
        title: "ប្រតិបត្តិការបានជោគជ័យ",
        description: "បានปรับปรุงកាលវិភាគប្រតិបត្តិករ។",
      });
      setOperatorSchedule(updatedSchedule); 
      const tableData: ScheduleEntry[] = Object.entries(updatedSchedule)
        .map(([date, operator]) => ({ date, operator }))
        .sort((a, b) => parseMmDdYy(a.date).getTime() - parseMmDdYy(b.date).getTime());
      setScheduleForTable(tableData);
    } catch (error) {
      console.error("Failed to save schedule changes:", error);
      toast({
        variant: "destructive",
        title: "ប្រតិបត្តិការបរាជ័យ",
        description: `Failed to save schedule changes. ${error instanceof Error ? error.message : ''}. Please refresh and try again.`,
      });
      await loadSchedule(); 
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event: ProgressEvent<FileReader>) => {
      const arrayBuffer = event.target?.result;
      if (!arrayBuffer || !(arrayBuffer instanceof ArrayBuffer)) {
        console.error('Failed to read file as ArrayBuffer');
        toast({ variant: "destructive", title: "ប្រតិបត្តិការបរាជ័យ", description: "មិនអាចអានឯកសារបានទេ។" });
        return;
      }

      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, {type: 'array'});
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {header: 1});

      const newScheduleEntriesForApi: { date: string, operator: string }[] = [];
      
      for (let i = 1; i < jsonData.length; i++) { 
        const row = jsonData[i];
        const date1Input = row[0];
        const operator1 = row[1] as string;
        const date2Input = row[3]; 
        const operator2 = row[4] as string; 

        const processEntry = (dateInput: any, operator: string) => {
          if (dateInput && operator) {
            const formattedDate = formatDateFromExcel(dateInput);
            if (formattedDate) {
              newScheduleEntriesForApi.push({ date: formattedDate, operator });
            }
          }
        };
        processEntry(date1Input, operator1);
        processEntry(date2Input, operator2);
      }
      
      if (newScheduleEntriesForApi.length === 0) {
        toast({ title: "No Data", description: "No valid schedule entries found in the Excel file."});
        return;
      }

      try {
        
        const response = await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newScheduleEntriesForApi), 
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save operator schedule');
        }
        
        toast({ title: "ប្រតិបត្តិការបានជោគជ័យ", description: "បានបញ្ចូលទិន្នន័យប្រតិបត្តិករដោយជោគជ័យ។" });
        await loadSchedule(); 
      } catch (error) {
        console.error("Failed to save operator schedule:", error);
        toast({
          variant: "destructive",
          title: "ប្រតិបត្តិការបរាជ័យ",
          description: `Failed to save operator schedule. ${error instanceof Error ? error.message : ''}`,
        });
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      toast({ variant: "destructive", title: "ប្រតិបត្តិការបរាជ័យ", description: "មិនអាចបញ្ចូលទិន្នន័យបានទេ។ សូម​ព្យាយាម​ម្តង​ទៀត។"});
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; 
  };

  const formatDateFromExcel = (excelDate: any): string | null => {
    if (typeof excelDate === 'number') { 
      try {
        const date = new Date(Date.UTC(0, 0, excelDate - 1)); 
        if (date) {
          const day = date.getUTCDate().toString().padStart(2, '0');
          const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); 
          const year = date.getUTCFullYear().toString().slice(-2);
          return `${month}-${day}-${year}`;
        }
      } catch (e) {
         console.warn("Could not parse numeric date from Excel:", excelDate, e);
      }
    } else if (typeof excelDate === 'string') { 
        const commonFormats = ["MM/dd/yy", "M/d/yy", "MM-dd-yy", "M-d-yy", "yyyy-MM-dd"];
        for (const fmt of commonFormats) {
            try {
                let parsedDate;
                if (fmt.includes("yyyy")) { 
                     parsedDate = parse(excelDate, fmt, new Date());
                } else { 
                     parsedDate = parse(excelDate, fmt, new Date());
                     if (parsedDate.getFullYear() < 1970) parsedDate.setFullYear(parsedDate.getFullYear() + 100);
                }
                if (!isNaN(parsedDate.getTime())) {
                    return format(parsedDate, 'MM-dd-yy');
                }
            } catch (e) { /* try next format */ }
        }
    }
    console.warn("Could not parse date from Excel:", excelDate, "(type:", typeof excelDate, ")");
    return null;
  };

  const handleOpenEditModal = (entry: ScheduleEntry) => {
    setCurrentEditingEntry(entry);
    setEditedDateString(entry.date);
    setEditedOperatorName(entry.operator);
    setIsEditModalOpen(true);
  };

  const validateMmDdYy = (dateStr: string): boolean => {
    return /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-(\d{2})$/.test(dateStr);
  };

  const handleSaveEdit = async () => {
    if (!currentEditingEntry) return;
    if (!validateMmDdYy(editedDateString)) {
      toast({ variant: "destructive", title: "Invalid Date Format", description: "Please use MM-DD-YY format." });
      return;
    }
    if (!editedOperatorName.trim()) {
      toast({ variant: "destructive", title: "Operator Name Required", description: "Operator name cannot be empty." });
      return;
    }

    const newSchedule = { ...operatorSchedule };
    
    if (currentEditingEntry.date !== editedDateString && newSchedule.hasOwnProperty(currentEditingEntry.date)) {
      delete newSchedule[currentEditingEntry.date];
    }
    newSchedule[editedDateString] = editedOperatorName.trim();
    
    await persistSchedule(newSchedule);
    setIsEditModalOpen(false);
    setCurrentEditingEntry(null);
  };

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;

    const newSchedule = { ...operatorSchedule };
    delete newSchedule[entryToDelete.date];
    
    await persistSchedule(newSchedule);
    setEntryToDelete(null); 
  };
  
  const handleExportToExcel = () => {
    const dataToExport = scheduleForTable.map(entry => ({
      'Date (MM-DD-YY)': entry.date,
      'Operator': entry.operator,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "OperatorSchedule");
    XLSX.writeFile(workbook, "operator_schedule_export.xlsx");
    toast({ title: "ការនាំចេញបានចាប់ផ្តើម", description: "ឯកសារ operator_schedule_export.xlsx កំពុងត្រូវបានទាញយក។" });
  };


  if (!isAdmin || isLoading) {
    return <div className="container mx-auto p-4 md:p-8 flex justify-center items-center h-screen font-khmer">Loading...</div>;
  }

  return (
    <main className="container mx-auto p-4 md:p-8 font-khmer">
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Page</CardTitle>
          <CardDescription>Manage operator schedules here.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Operator Data</CardTitle>
              <CardDescription>Upload an Excel file (XLSX, XLS) to add or update operator schedules. New entries will be appended, existing dates will be updated.</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="excel-upload" className="sr-only">Choose Excel file</Label>
              <div className="relative">
                <Input 
                  type="file" 
                  id="excel-upload"
                  accept=".xlsx, .xls" 
                  onChange={handleExcelUpload}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-foreground hover:file:bg-accent/90 cursor-pointer sr-only"
                />
                 <Button asChild variant="outline" className="w-full cursor-pointer bg-accent text-accent-foreground hover:bg-accent/90">
                    <Label htmlFor="excel-upload" className="cursor-pointer flex items-center justify-center">
                        <UploadCloud className="mr-2 h-4 w-4" /> Choose Excel File
                    </Label>
                </Button>
              </div>
            </CardContent>
          </Card>

          {scheduleForTable.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Operator Schedule</CardTitle>
                  <CardDescription>Current operator schedule. You can edit, delete, or export this data.</CardDescription>
                </div>
                <Button onClick={handleExportToExcel} variant="outline" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <FileDown className="mr-2 h-4 w-4" /> Export to Excel
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-foreground font-semibold">Date (dd/MM/yy)</TableHead>
                        <TableHead className="text-foreground font-semibold">Day</TableHead>
                        <TableHead className="text-foreground font-semibold">Operator</TableHead>
                        <TableHead className="text-foreground font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduleForTable.map((entry) => (
                        <TableRow key={entry.date}>
                          <TableCell className="text-muted-foreground">
                            {format(parseMmDdYy(entry.date), 'dd/MM/yy')}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(parseMmDdYy(entry.date), 'EEEE', { locale: km })}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{entry.operator}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(entry)} className="hover:bg-primary/20">
                              <Edit2 className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" onClick={() => setEntryToDelete(entry)}>
                                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                              </AlertDialogTrigger>
                              {entryToDelete?.date === entry.date && (
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the schedule entry for {format(parseMmDdYy(entry.date), 'dd/MM/yy')} ({entry.operator}).
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setEntryToDelete(null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteEntry}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              )}
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter>
            <Button onClick={() => {
              localStorage.removeItem('admin');
              setIsAdmin(false);
              router.push('/');
            }} className="bg-accent text-accent-foreground hover:bg-accent/90">Log Out</Button>
        </CardFooter>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] font-khmer">
          <DialogHeader>
            <DialogTitle>Edit Schedule Entry</DialogTitle>
            <DialogDescription>
              Make changes to the schedule entry. Click save when you're done. Date format must be MM-DD-YY.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date-trigger" className="text-right">
                Date (MM-DD-YY)
              </Label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    id="edit-date-trigger"
                    className={cn(
                      "col-span-3 justify-start text-left font-normal bg-card text-card-foreground hover:bg-card/90",
                      !editedDateString && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedDateString ? editedDateString : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editedDateString ? parseMmDdYy(editedDateString) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setEditedDateString(format(date, 'MM-dd-yy'));
                      }
                    }}
                    initialFocus
                  />
                  <div className="p-2 border-t border-border flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsDatePickerOpen(false)}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      OK
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-operator" className="text-right">
                Operator
              </Label>
              <Input
                id="edit-operator"
                value={editedOperatorName}
                onChange={(e) => setEditedOperatorName(e.target.value)}
                className="col-span-3 bg-card text-card-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveEdit} className="bg-accent text-accent-foreground hover:bg-accent/90">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
