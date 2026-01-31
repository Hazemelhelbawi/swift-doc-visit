import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Repeat, Clock } from 'lucide-react';

interface Clinic {
  id: string;
  name: string;
  name_ar: string | null;
}

interface ScheduleFormData {
  clinic_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_patients: number;
  is_active: boolean;
  is_recurring: boolean;
  recurrence_pattern: 'daily' | 'weekly' | 'custom' | null;
  recurrence_days: number[];
  recurrence_end_date: string;
}

interface ScheduleFormProps {
  formData: ScheduleFormData;
  setFormData: (data: ScheduleFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  clinics: Clinic[] | undefined;
  isSubmitting: boolean;
  isEditing: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, labelEn: 'Sun', labelAr: 'أحد' },
  { value: 1, labelEn: 'Mon', labelAr: 'اثنين' },
  { value: 2, labelEn: 'Tue', labelAr: 'ثلاثاء' },
  { value: 3, labelEn: 'Wed', labelAr: 'أربعاء' },
  { value: 4, labelEn: 'Thu', labelAr: 'خميس' },
  { value: 5, labelEn: 'Fri', labelAr: 'جمعة' },
  { value: 6, labelEn: 'Sat', labelAr: 'سبت' },
];

export function ScheduleForm({ formData, setFormData, onSubmit, clinics, isSubmitting, isEditing }: ScheduleFormProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const toggleDay = (day: number) => {
    const days = formData.recurrence_days || [];
    if (days.includes(day)) {
      setFormData({ ...formData, recurrence_days: days.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, recurrence_days: [...days, day].sort() });
    }
  };

  const handleRecurrencePatternChange = (pattern: string) => {
    if (pattern === 'none') {
      setFormData({ 
        ...formData, 
        is_recurring: false, 
        recurrence_pattern: null,
        recurrence_days: [],
        recurrence_end_date: ''
      });
    } else {
      setFormData({ 
        ...formData, 
        is_recurring: true, 
        recurrence_pattern: pattern as 'daily' | 'weekly' | 'custom',
        recurrence_days: pattern === 'daily' ? [] : formData.recurrence_days
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Clinic Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          {t('admin.clinic')}
        </Label>
        <Select
          value={formData.clinic_id}
          onValueChange={(value) => setFormData({ ...formData, clinic_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('admin.selectClinic')} />
          </SelectTrigger>
          <SelectContent>
            {clinics?.map((clinic) => (
              <SelectItem key={clinic.id} value={clinic.id}>
                {language === 'ar' && clinic.name_ar ? clinic.name_ar : clinic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Settings */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
        <h4 className="font-medium flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-primary" />
          {t('admin.timeSettings')}
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('admin.startTime')}</Label>
            <Input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.endTime')}</Label>
            <Input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('admin.maxPatients')}</Label>
          <Input
            type="number"
            min="1"
            value={formData.max_patients}
            onChange={(e) => setFormData({ ...formData, max_patients: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      {/* Recurrence Settings */}
      <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-4">
        <h4 className="font-medium flex items-center gap-2 text-sm">
          <Repeat className="h-4 w-4 text-primary" />
          {t('admin.recurrence')}
        </h4>

        <div className="space-y-2">
          <Label>{t('admin.recurrencePattern')}</Label>
          <Select
            value={formData.is_recurring ? (formData.recurrence_pattern || 'none') : 'none'}
            onValueChange={handleRecurrencePatternChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('admin.oneTime')}</SelectItem>
              <SelectItem value="daily">{t('admin.daily')}</SelectItem>
              <SelectItem value="weekly">{t('admin.weekly')}</SelectItem>
              <SelectItem value="custom">{t('admin.customDays')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!formData.is_recurring && (
          <div className="space-y-2">
            <Label>{t('admin.date')}</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
        )}

        {formData.is_recurring && (
          <>
            <div className="space-y-2">
              <Label>{t('admin.startDate')}</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            {(formData.recurrence_pattern === 'weekly' || formData.recurrence_pattern === 'custom') && (
              <div className="space-y-2">
                <Label>{t('admin.selectDays')}</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.recurrence_days?.includes(day.value)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {language === 'ar' ? day.labelAr : day.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('admin.endDate')} ({t('admin.optional')})</Label>
              <Input
                type="date"
                value={formData.recurrence_end_date}
                onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                min={formData.date}
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.endDateHint')}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label className="cursor-pointer">{t('admin.active')}</Label>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isEditing ? t('admin.update') : t('admin.create')}
      </Button>
    </form>
  );
}
