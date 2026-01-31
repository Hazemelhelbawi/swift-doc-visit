-- Add recurring schedule support to schedules table
ALTER TABLE public.schedules 
ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'custom')),
ADD COLUMN recurrence_days INTEGER[] DEFAULT NULL,
ADD COLUMN recurrence_end_date DATE DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.schedules.is_recurring IS 'Whether this schedule repeats';
COMMENT ON COLUMN public.schedules.recurrence_pattern IS 'Pattern: daily, weekly, or custom';
COMMENT ON COLUMN public.schedules.recurrence_days IS 'Days of week (0=Sunday, 6=Saturday) for weekly/custom patterns';
COMMENT ON COLUMN public.schedules.recurrence_end_date IS 'End date for recurring schedules';

-- Create a function to generate recurring schedule instances
CREATE OR REPLACE FUNCTION public.get_available_schedules(
  p_clinic_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  schedule_id UUID,
  clinic_id UUID,
  schedule_date DATE,
  start_time TIME,
  end_time TIME,
  max_patients INTEGER,
  is_recurring BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  current_date_iter DATE;
  day_of_week INTEGER;
BEGIN
  -- Return non-recurring schedules
  FOR r IN 
    SELECT s.id, s.clinic_id, s.date, s.start_time, s.end_time, s.max_patients, s.is_recurring
    FROM schedules s
    WHERE s.clinic_id = p_clinic_id
      AND s.is_active = true
      AND s.is_recurring = false
      AND s.date BETWEEN p_start_date AND p_end_date
  LOOP
    schedule_id := r.id;
    clinic_id := r.clinic_id;
    schedule_date := r.date;
    start_time := r.start_time;
    end_time := r.end_time;
    max_patients := r.max_patients;
    is_recurring := r.is_recurring;
    RETURN NEXT;
  END LOOP;
  
  -- Generate instances for recurring schedules
  FOR r IN 
    SELECT s.id, s.clinic_id, s.date, s.start_time, s.end_time, s.max_patients, 
           s.recurrence_pattern, s.recurrence_days, s.recurrence_end_date
    FROM schedules s
    WHERE s.clinic_id = p_clinic_id
      AND s.is_active = true
      AND s.is_recurring = true
      AND s.date <= p_end_date
      AND (s.recurrence_end_date IS NULL OR s.recurrence_end_date >= p_start_date)
  LOOP
    current_date_iter := GREATEST(r.date, p_start_date);
    
    WHILE current_date_iter <= LEAST(p_end_date, COALESCE(r.recurrence_end_date, p_end_date)) LOOP
      day_of_week := EXTRACT(DOW FROM current_date_iter)::INTEGER;
      
      -- Check if this date should be included based on recurrence pattern
      IF r.recurrence_pattern = 'daily' THEN
        schedule_id := r.id;
        clinic_id := r.clinic_id;
        schedule_date := current_date_iter;
        start_time := r.start_time;
        end_time := r.end_time;
        max_patients := r.max_patients;
        is_recurring := true;
        RETURN NEXT;
      ELSIF r.recurrence_pattern = 'weekly' OR r.recurrence_pattern = 'custom' THEN
        IF r.recurrence_days IS NOT NULL AND day_of_week = ANY(r.recurrence_days) THEN
          schedule_id := r.id;
          clinic_id := r.clinic_id;
          schedule_date := current_date_iter;
          start_time := r.start_time;
          end_time := r.end_time;
          max_patients := r.max_patients;
          is_recurring := true;
          RETURN NEXT;
        END IF;
      END IF;
      
      current_date_iter := current_date_iter + 1;
    END LOOP;
  END LOOP;
END;
$$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_schedules_recurring ON public.schedules (clinic_id, is_recurring, is_active);
CREATE INDEX IF NOT EXISTS idx_schedules_date_range ON public.schedules (clinic_id, date, is_active);