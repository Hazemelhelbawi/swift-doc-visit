-- Fix appointments with NULL doctor_id by inferring from their schedule's doctor_id
UPDATE appointments a
SET doctor_id = s.doctor_id
FROM schedules s
WHERE a.schedule_id = s.id
  AND a.doctor_id IS NULL
  AND s.doctor_id IS NOT NULL;