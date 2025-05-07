
export interface AlarmLogEntry {
  id: string;
  date: Date | undefined;
  operatorName?: string;
}

export interface ReportData {
  salutation: 'ខ្ញុំបាទ' | 'នាងខ្ញុំ';
  hasSystemIssue: boolean;
  laneNumber?: string[]; // Changed from string to string[] for multiple lanes
  hasEquipmentIssue: boolean; 
  equipmentComments: string;
  alarmLogs: AlarmLogEntry[];
}

