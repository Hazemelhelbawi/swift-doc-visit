import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pencil, Trash2, Clock, Users, Repeat, Calendar } from 'lucide-react';

interface Schedule {
  id: string;
  clinic_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_patients: number;
  is_active: boolean;
  is_recurring?: boolean;
  recurrence_pattern?: string | null;
  recurrence_days?: number[] | null;
  recurrence_end_date?: string | null;
  clinics?: { name: string; name_ar: string | null };
}

interface ScheduleCardProps {
  schedule: Schedule;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
}

const DAYS_OF_WEEK_SHORT = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
};

export function ScheduleCard({ schedule, onEdit, onDelete }: ScheduleCardProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const locale = language === 'ar' ? ar : enUS;

  const getClinicName = () => {
    if (!schedule.clinics) return '-';
    return language === 'ar' && schedule.clinics.name_ar 
      ? schedule.clinics.name_ar 
      : schedule.clinics.name;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getRecurrenceLabel = () => {
    if (!schedule.is_recurring) return null;
    
    const pattern = schedule.recurrence_pattern;
    const days = schedule.recurrence_days || [];
    const daysLabels = language === 'ar' ? DAYS_OF_WEEK_SHORT.ar : DAYS_OF_WEEK_SHORT.en;
    
    if (pattern === 'daily') {
      return t('admin.daily');
    } else if (pattern === 'weekly' || pattern === 'custom') {
      const selectedDays = days.map(d => daysLabels[d]).join(', ');
      return selectedDays || t('admin.weekly');
    }
    return null;
  };

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      schedule.is_active 
        ? 'border-border bg-card hover:border-primary/30' 
        : 'border-border/50 bg-muted/30 opacity-60'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-foreground">{getClinicName()}</h4>
          <div className="flex items-center gap-2 mt-1">
            {schedule.is_recurring ? (
              <Badge variant="secondary" className="gap-1">
                <Repeat className="h-3 w-3" />
                {getRecurrenceLabel()}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(schedule.date), 'MMM dd, yyyy', { locale })}
              </Badge>
            )}
            <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
              {schedule.is_active ? t('admin.active') : t('admin.inactive')}
            </Badge>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(schedule)} className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(schedule.id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Time and Capacity */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span dir="ltr">{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          <span>{schedule.max_patients} {t('admin.patients')}</span>
        </div>
      </div>

      {/* Recurring Details */}
      {schedule.is_recurring && schedule.recurrence_end_date && (
        <div className="mt-2 text-xs text-muted-foreground">
          {t('admin.until')} {format(new Date(schedule.recurrence_end_date), 'MMM dd, yyyy', { locale })}
        </div>
      )}

      {/* Start date for recurring */}
      {schedule.is_recurring && (
        <div className="mt-2 text-xs text-muted-foreground">
          {t('admin.from')} {format(new Date(schedule.date), 'MMM dd, yyyy', { locale })}
        </div>
      )}
    </div>
  );
}
