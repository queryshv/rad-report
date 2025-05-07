
"use client";

import type { FC } from 'react';
import type { ReportData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDateWithKhmerDay } from '@/lib/utils';

interface ReportPreviewProps {
  data: ReportData;
}

const ReportPreview: FC<ReportPreviewProps> = ({ data }) => {
  const { salutation, hasSystemIssue, laneNumber, hasEquipmentIssue, equipmentComments, alarmLogs } = data;

  let systemIssueText;
  if (hasSystemIssue) {
    if (laneNumber && laneNumber.length > 0) {
      systemIssueText = `ប្រព័ន្ធ​មាន​បញ្ហា៖ ${laneNumber.join(', ')}`;
    } else {
      systemIssueText = <span className="text-destructive">ប្រព័ន្ធ​មាន​បញ្ហា (មិនបានបញ្ជាក់ Lane)</span>;
    }
  } else {
    systemIssueText = 'ប្រព័ន្ធ មិន​មាន​បញ្ហា';
  }

  const equipmentDisplayText = hasEquipmentIssue ? (
    <>
      ឧបករណ៍មានបញ្ហដូចខាងក្រោម៖
      <br />
      <span className="pl-4 block">
        {equipmentComments 
          ? `- ${equipmentComments}` 
          : <span className="text-destructive">- មិន​មាន​ការ​ពិពណ៌នា​បញ្ហា​ឧបករណ៍</span>
        }
      </span>
    </>
  ) : (
    'ឧបករណ៏គ្រប់ចំនួន'
  );

  const sortedAlarmLogs = [...alarmLogs].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1; 
    if (!b.date) return -1;
    return a.date.getTime() - b.date.getTime();
  });


  return (
    <Card className="bg-card text-card-foreground shadow-xl font-khmer">
      <CardHeader>
        <CardTitle className="text-2xl text-accent">របាយការណ៍​ប្រចាំថ្ងៃ</CardTitle>
        <CardDescription>ការ​បង្ហាញ​ជាមុន​នៃ​របាយការណ៍​របស់​អ្នក</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-base leading-relaxed">
        <p>{salutation} សូមរាយការណ៍ប្រចាំថ្ងៃអំពីប្រព័ន្ធរាវរកសារធាតុវិទ្យុសកម្ម៖</p>
        
        <Separator />

        <div className="pl-4 space-y-1">
          <p>១. {systemIssueText}</p>
          <div>២. {equipmentDisplayText}</div>
          <div>
            <p>៣. សំឡេងរោទ៍នៅសល់មាន៖</p>
            {sortedAlarmLogs.length > 0 ? (
              <ul className="list-none pl-6 space-y-1">
                {sortedAlarmLogs.map((log) => (
                  <li key={log.id}>
                    -ថ្ងៃទី​ {log.date ? formatDateWithKhmerDay(log.date) : <span className="text-destructive">(មិនទាន់ជ្រើសរើសថ្ងៃខែ)</span>}
                    {log.date && (
                      log.operatorName && log.operatorName !== 'មិនមានឈ្មោះប្រតិបត្តិករ'
                        ? ` ${log.operatorName}`
                        : <span className="text-destructive"> (ប្រតិបត្តិករ៖ មិនមាន ឬមិនត្រឹមត្រូវ)</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pl-6 italic text-muted-foreground">- មិន​មាន​សំឡេង​រោទ៍​នៅសល់</p>
            )}
          </div>
        </div>

        <Separator />
        
        <p className="font-semibold">សូមអរគុណ!</p>
      </CardContent>
    </Card>
  );
};

export default ReportPreview;
