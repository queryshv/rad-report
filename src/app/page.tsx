
'use client';

import { useState, useEffect } from 'react';
import ReportForm from '@/components/report-form';
import ReportPreview from '@/components/report-preview';
import type { ReportData } from '@/types';
import { Button } from '@/components/ui/button';
import { Download, ClipboardCopy } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { parseMmDdYy, formatDateWithKhmerDay } from '@/lib/utils';

interface OperatorSchedule {
  [date: string]: string; // date string (MM-DD-YY) => operator name
}

export default function Home() {
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData>({
    salutation: 'ខ្ញុំបាទ',
    hasSystemIssue: false,
    laneNumber: [],
    hasEquipmentIssue: false,
    equipmentComments: '',
    alarmLogs: [],
  });
  const { toast } = useToast();
  const [operatorSchedule, setOperatorSchedule] = useState<OperatorSchedule>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const loadSchedule = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/schedule');
        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || `Failed to fetch schedule: ${response.statusText}`);
        }
        const data: OperatorSchedule = await response.json();
        setOperatorSchedule(data);
      } catch (error) {
        console.error("Error loading operator schedule:", error);
        toast({
          variant: "destructive",
          title: "ប្រតិបត្តិការបរាជ័យ",
          description: `Failed to load operator schedule. ${error instanceof Error ? error.message : 'Please check server logs.'}`,
        });
      } finally {
        setIsLoading(false);
      }
    };

    const checkAdminStatus = () => {
      const adminStatus = localStorage.getItem('admin');
      if (adminStatus === 'true') {
        setIsAdmin(true);
      }
    };

    loadSchedule();
    checkAdminStatus();
  }, [toast]);

  const handleReportDataChange = (newData: ReportData) => {
    setReportData(newData);
  };

  const generateReportText = (data: ReportData): string => {
    let reportText = `${data.salutation} សូមរាយការណ៍ប្រចាំថ្ងៃអំពីប្រព័ន្ធរាវរកសារធាតុវិទ្យុសកម្ម៖\n\n`;

    let systemIssueText;
    if (data.hasSystemIssue) {
      if (data.laneNumber && data.laneNumber.length > 0) {
        systemIssueText = `ប្រព័ន្ធ​មាន​បញ្ហា៖ ${data.laneNumber.join(', ')}`;
      } else {
        systemIssueText = 'ប្រព័ន្ធ​មាន​បញ្ហា (មិនបានបញ្ជាក់ Lane)';
      }
    } else {
      systemIssueText = 'ប្រព័ន្ធ មិន​មាន​បញ្ហា';
    }
    reportText += `១. ${systemIssueText}\n`;

    let equipmentStatusText;
    if (data.hasEquipmentIssue) {
      equipmentStatusText = `ឧបករណ៍មានបញ្ហដូចខាងក្រោម៖\n${data.equipmentComments ? `- ${data.equipmentComments}` : '- មិន​មាន​ការ​ពិពណ៌នា​បញ្ហា​ឧបករណ៍'}`;
    } else {
      equipmentStatusText = 'ឧបករណ៏គ្រប់ចំនួន';
    }
    reportText += `២. ${equipmentStatusText}\n`;

    reportText += '៣. សំឡេងរោទ៍នៅសល់មាន៖\n';

    const sortedAlarmLogs = [...data.alarmLogs].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1; // a is undefined, b is defined, so b comes first
      if (!b.date) return -1; // b is undefined, a is defined, so a comes first
      return a.date.getTime() - b.date.getTime();
    });

    if (sortedAlarmLogs.length > 0) {
      sortedAlarmLogs.forEach(log => {
        const dateObj = log.date; // Date is already a Date object or undefined
        const dateStr = dateObj ? formatDateWithKhmerDay(dateObj) : '(មិនទាន់ជ្រើសរើសថ្ងៃខែ)';
        const operatorNameStr = log.operatorName || '(មិនមានឈ្មោះប្រតិបត្តិករ)';
        reportText += `-ថ្ងៃទី​ ${dateStr} ${operatorNameStr}\n`;
      });
    } else {
      reportText += '- មិន​មាន​សំឡេង​រោទ៍​នៅសល់\n';
    }

    reportText += '\nសូមអរគុណ!';
    return reportText;
  };

  const handleDownloadReport = () => {
    const reportText = generateReportText(reportData);
    const blob = new Blob([reportText], {type: 'text/plain;charset=utf-8'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const today = format(new Date(), "dd-MM-yyyy");
    link.download = `របាយការណ៍ប្រចាំថ្ងៃ-${today}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "ការទាញយកបានចាប់ផ្តើម",
      description: `ឯកសារ ${link.download} កំពុងត្រូវបានទាញយក។`,
    });
  };

  const handleCopyReport = async () => {
    const reportText = generateReportText(reportData);
    try {
      await navigator.clipboard.writeText(reportText);
      toast({
        title: "បានចម្លងដោយជោគជ័យ",
        description: "មាតិកា​របាយការណ៍​ត្រូវ​បាន​ចម្លង​ទៅ​ក្ដារ​តម្បៀត​ខ្ទាស់​ហើយ។",
      });
    } catch (err) {
      console.error('Failed to copy report: ', err);
      toast({
        variant: "destructive",
        title: "ការចម្លងបានបរាជ័យ",
        description: "មិនអាចចម្លងរបាយការណ៍បានទេ។ សូម​ព្យាយាម​ម្តង​ទៀត។",
      });
    }
  };
  
  if (isLoading) {
    return <div className="container mx-auto p-4 md:p-8 flex justify-center items-center h-screen font-khmer">Loading...</div>;
  }

  return (
    <main className="container mx-auto p-4 md:p-8 selection:bg-accent selection:text-accent-foreground font-khmer">
      <header className="mb-8 text-center relative">
        <h1 className="text-4xl font-bold text-foreground">Daily Rad Report</h1>
        <p className="text-xl text-muted-foreground mt-2">កម្មវិធី​បង្កើត​របាយការណ៍​ប្រចាំថ្ងៃ</p>
        <div className="absolute top-0 right-0">
          {isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://picsum.photos/100/100" alt="Admin" data-ai-hint="admin user"/>
                    <AvatarFallback>Admin</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>Admin</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                 <DropdownMenuItem onClick={() => router.push('/admin')}>
                  ទំព័រ​អ្នកគ្រប់គ្រង
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  localStorage.removeItem('admin');
                  setIsAdmin(false);
                  router.push('/'); 
                }}>ចាកចេញ</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => router.push('/login')}
                    className="bg-accent text-accent-foreground hover:bg-accent/90">
              ចូលជាអ្នកគ្រប់គ្រង
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <ReportForm onReportDataChange={handleReportDataChange} initialData={reportData}
                      operatorSchedule={operatorSchedule}/>
        </div>
        <div>
          <ReportPreview data={reportData}/>
          <div className="mt-6 flex justify-end space-x-2">
            <Button
              onClick={handleCopyReport}
              variant="default"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={!reportData.alarmLogs.every(log => log.date && log.operatorName && log.operatorName !== 'មិនមានឈ្មោះប្រតិបត្តិករ')}
            >
              <ClipboardCopy className="mr-2 h-5 w-5"/>
              ចម្លង​មាតិកា
            </Button>
            <Button
              onClick={handleDownloadReport}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={!reportData.alarmLogs.every(log => log.date && log.operatorName && log.operatorName !== 'មិនមានឈ្មោះប្រតិបត្តិករ')}
            >
              <Download className="mr-2 h-5 w-5"/>
              ទាញយក​របាយការណ៍
            </Button>
          </div>
          {reportData.alarmLogs.some(log => !log.date || !log.operatorName || log.operatorName === 'មិនមានឈ្មោះប្រតិបត្តិករ') && (
            <p className="text-sm text-destructive mt-2 text-right">
              សូមបំពេញព័ត៌មានសំឡេងរោទ៍ទាំងអស់ (កាលបរិច្ឆេទ និងឈ្មោះប្រតិបត្តិករត្រឹមត្រូវ) មុននឹង Copy​​ ។
            </p>
          )}
        </div>
      </div>


      <footer className="mt-12 pt-8 border-t text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Daily Rad Report. រក្សា​សិទ្ធិ​គ្រប់​យ៉ាង។</p>
      </footer>
    </main>
  );
}
