
'use client';

import type {FC} from 'react';
import React from 'react';
import {useForm, useFieldArray, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Checkbox} from '@/components/ui/checkbox';
import {Textarea} from '@/components/ui/textarea';
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {PlusCircle, Trash2, CalendarIcon} from 'lucide-react';
import type {ReportData} from '@/types';
import {format} from "date-fns";
import {cn, formatDate} from "@/lib/utils";

const alarmLogEntrySchema = z.object({
  id: z.string(),
  date: z.date({required_error: "សូមជ្រើសរើសថ្ងៃខែ។"}).optional(),
  operatorName: z.string().optional()
});

export const reportSchema = z.object({
  salutation: z.enum(['ខ្ញុំបាទ', 'នាងខ្ញុំ']),
  hasSystemIssue: z.boolean(),
  laneNumber: z.array(z.string()).optional(), // Changed to array of strings
  hasEquipmentIssue: z.boolean(),
  equipmentComments: z.string().optional(),
  alarmLogs: z.array(alarmLogEntrySchema),
}).refine(data => {
  if (data.hasSystemIssue && (!data.laneNumber || data.laneNumber.length === 0)) {
    return false; // laneNumber array must not be empty if system has issue
  }
  return true;
}, {
  message: "សូមជ្រើសរើសយ៉ាងហោចណាស់មួយ Lane ប្រសិនបើប្រព័ន្ធមានបញ្ហា។",
  path: ["laneNumber"],
}).refine(data => {
  if (data.hasEquipmentIssue && (!data.equipmentComments || data.equipmentComments.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "សូម​បញ្ចូល​ការ​ពិពណ៌នា​បញ្ហា​ឧបករណ៍ ប្រសិនបើ​បាន​ធីកថា​មានបញ្ហា។",
  path: ["equipmentComments"],
});


interface ReportFormProps {
  onReportDataChange: (data: ReportData) => void;
  initialData: ReportData;
  operatorSchedule?: {[date: string]: string};
}

const ReportForm: FC<ReportFormProps> = ({onReportDataChange, initialData, operatorSchedule = {}}) => {
  const form = useForm<ReportData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      ...initialData,
      laneNumber: initialData.laneNumber || [], // Ensure laneNumber is an array
    },
    mode: 'onChange',
  });

  const {fields, append, remove} = useFieldArray({
    control: form.control,
    name: "alarmLogs",
  });

  const [popoverOpenState, setPopoverOpenState] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const subscription = form.watch((values, {name}) => {
      const currentValues = {...values, laneNumber: values.laneNumber || []} as ReportData;
      if (name === 'hasSystemIssue' && !currentValues.hasSystemIssue) {
        form.setValue('laneNumber', [], {shouldValidate: true});
        currentValues.laneNumber = []; // Update local copy for onReportDataChange
      }
      if (name === 'hasEquipmentIssue' && !currentValues.hasEquipmentIssue) {
        form.setValue('equipmentComments', '', {shouldValidate: true});
        currentValues.equipmentComments = ''; // Update local copy
        form.clearErrors('equipmentComments');
      }
      onReportDataChange(currentValues);
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch, onReportDataChange, form.setValue, form.clearErrors]);

  const allLanes = Array.from({length: 10}, (_, i) => `Lane ${i + 1}`);

  const handleLaneChange = (laneValue: string, checked: boolean | "indeterminate") => {
    const currentSelectedLanes = form.getValues("laneNumber") || [];
    let newSelectedLanes: string[];
    if (checked === true) {
      newSelectedLanes = [...currentSelectedLanes, laneValue];
    } else {
      newSelectedLanes = currentSelectedLanes.filter(lane => lane !== laneValue);
    }
    form.setValue("laneNumber", newSelectedLanes, {shouldValidate: true});
  };


  const handleDateSelect = (date: Date | undefined, index: number) => {
    if (date) {
      const formattedDateKey = format(date, 'MM-dd-yy'); // Key for schedule lookup
      const operatorName = operatorSchedule?.[formattedDateKey] || 'មិនមានឈ្មោះប្រតិបត្តិករ';

      form.setValue(`alarmLogs.${index}.date`, date, {shouldValidate: true});
      form.setValue(`alarmLogs.${index}.operatorName`, operatorName, {shouldValidate: true});
    } else {
      form.setValue(`alarmLogs.${index}.date`, undefined, {shouldValidate: true});
      form.setValue(`alarmLogs.${index}.operatorName`, undefined, {shouldValidate: true});
    }
  };


  const handleAddNewLog = () => {
    const newId = crypto.randomUUID();
    append({id: newId, date: undefined, operatorName: undefined});
    setPopoverOpenState(prev => ({...prev, [newId]: false}));
  };

  return (
    <Card className="bg-card text-card-foreground shadow-xl font-khmer">
      <CardHeader>
        <CardTitle className="text-2xl text-accent">ព័ត៌មាន​សម្រាប់​របាយការណ៍</CardTitle>
        <CardDescription>សូម​បំពេញ​គ្រប់​ TextFormField ​ខាងក្រោម</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(() => {
        })} className="space-y-6">
          <div>
            <Label className="text-base">ស្ថានភាពប្រចាំថ្ងៃ</Label>
            <Controller
              control={form.control}
              name="salutation"
              render={({field}) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4 pt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ខ្ញុំបាទ" id="male" className="radio-item-darker dark:radio-item-darker"/>
                    <Label htmlFor="male">ខ្ញុំបាទ</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="នាងខ្ញុំ" id="female" className="radio-item-darker dark:radio-item-darker"/>
                    <Label htmlFor="female">នាងខ្ញុំ</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          <div className="space-y-4 p-4 border rounded-md bg-background">
            <Label className="text-base block mb-2">១. ប្រព័ន្ធរាវរកសារធាតុវិទ្យុសកម្ម</Label>
            <div className="flex items-center space-x-2">
              <Controller
                control={form.control}
                name="hasSystemIssue"
                render={({field}) => (
                  <Checkbox
                    id="hasSystemIssue"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="checkbox-darker dark:checkbox-darker"
                  />
                )}
              />
              <Label htmlFor="hasSystemIssue">ប្រព័ន្ធ​មាន​បញ្ហា?</Label>
            </div>

            {form.watch("hasSystemIssue") && (
              <div className="space-y-2">
                <Label className="text-base mt-2 block">ជ្រើសរើស Lane ដែលមានបញ្ហា</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {allLanes.map(lane => (
                    <div key={lane} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lane-${lane.replace(/\s+/g, '-')}`} // Create a unique ID
                        checked={(form.getValues("laneNumber") || []).includes(lane)}
                        onCheckedChange={(checked) => handleLaneChange(lane, checked)}
                        className="checkbox-darker dark:checkbox-darker"
                      />
                      <Label htmlFor={`lane-${lane.replace(/\s+/g, '-')}`}>{lane}</Label>
                    </div>
                  ))}
                </div>
                {form.formState.errors.laneNumber &&
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.laneNumber.message}</p>}
              </div>
            )}
          </div>

          <div className="space-y-4 p-4 border rounded-md bg-background">
            <Label className="text-base block mb-2">២. ស្ថានភាព​ឧបករណ៏</Label>
            <div className="flex items-center space-x-2">
              <Controller
                control={form.control}
                name="hasEquipmentIssue"
                render={({field}) => (
                  <Checkbox
                    id="hasEquipmentIssue"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="checkbox-darker dark:checkbox-darker"
                  />
                )}
              />
              <Label htmlFor="hasEquipmentIssue">ឧបករណ៏​មាន​បញ្ហា?</Label>
            </div>

            {form.watch("hasEquipmentIssue") ? (
              <div>
                <Label htmlFor="equipmentComments" className="mt-2 block">ការ​ពិពណ៌នា​បញ្ហា​ឧបករណ៍</Label>
                <Textarea
                  id="equipmentComments"
                  {...form.register("equipmentComments")}
                  placeholder="សូម​បញ្ចូល​យោបល់​របស់​អ្នក​អំពី​បញ្ហា​ឧបករណ៍​នៅ​ទីនេះ..."
                  className="mt-1 bg-primary text-primary-foreground"
                />
                {form.formState.errors.equipmentComments &&
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.equipmentComments.message}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground italic mt-2">ឧបករណ៏គ្រប់ចំនួន (នៅពេលមិនបានធីកថាមានបញ្ហា)</p>
            )}
          </div>

          <div className="space-y-4 p-4 border rounded-md bg-background">
            <Label className="text-base block mb-2">៣. សំឡេងរោទ៍នៅសល់មាន</Label>
            {fields.map((item, index) => {
              const watchedDate = form.watch(`alarmLogs.${index}.date`);
              const watchedOperatorName = form.watch(`alarmLogs.${index}.operatorName`);

              return (
                <div key={item.id} className="p-3 border rounded-md space-y-1 bg-primary/50">
                    <Label htmlFor={`alarmLogs.${index}.date`} className="text-xs mb-1 block text-muted-foreground">
                        {watchedDate
                        ? `កាលបរិច្ឆេទ៖ ${formatDate(watchedDate)} / ប្រតិបត្តិករ៖ ${watchedOperatorName || 'មិនមានឈ្មោះ'}`
                        : 'សូមជ្រើសរើសកាលបរិច្ឆេទ'}
                    </Label>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-x-3 gap-y-2 items-end">
                    <div className="w-full">
                      <Controller
                        control={form.control}
                        name={`alarmLogs.${index}.date`}
                        render={({field}) => (
                          <Popover
                            open={popoverOpenState[item.id] || false}
                            onOpenChange={(isOpen) =>
                              setPopoverOpenState((prev) => ({...prev, [item.id]: isOpen}))
                            }
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                                  !field.value && "text-primary-foreground/70"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4"/>
                                {field.value
                                  ? `${formatDate(field.value)} (${form.getValues(`alarmLogs.${index}.operatorName`) || 'N/A'})`
                                  : <span>ជ្រើសរើសថ្ងៃខែ</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  handleDateSelect(date, index);
                                }}
                                initialFocus
                              />
                              <div className="p-2 border-t border-border flex justify-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() =>
                                    setPopoverOpenState((prev) => ({...prev, [item.id]: false}))
                                  }
                                >
                                  យល់ព្រម
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                      {form.formState.errors.alarmLogs?.[index]?.date && (
                        <p className="text-xs text-destructive ">{form.formState.errors.alarmLogs?.[index]?.date?.message}</p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      aria-label="Remove alarm log"
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                  </div>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddNewLog}
              className="mt-2 text-accent border-accent hover:bg-accent/10"
            >
              <PlusCircle className="mr-2 h-4 w-4"/> បន្ថែម​កំណត់​ត្រា​សំឡេង​រោទ៍
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReportForm;
