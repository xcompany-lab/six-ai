
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to auto-schedule reminders when appointments are created/updated
CREATE OR REPLACE FUNCTION public.schedule_reminders_for_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  config reminders_config%ROWTYPE;
  appt_datetime timestamptz;
  reminder_1_interval interval;
  reminder_2_interval interval;
  lead_phone text;
BEGIN
  -- Only process non-cancelled appointments
  IF NEW.status = 'cancelled' THEN
    DELETE FROM scheduled_reminders WHERE appointment_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Get reminder config for this user
  SELECT * INTO config FROM reminders_config WHERE user_id = NEW.user_id AND active = true LIMIT 1;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Get lead phone
  IF NEW.lead_id IS NOT NULL THEN
    SELECT phone INTO lead_phone FROM leads WHERE id = NEW.lead_id;
  END IF;

  -- If no phone found, skip
  IF lead_phone IS NULL OR lead_phone = '' THEN
    RETURN NEW;
  END IF;

  -- Build appointment datetime
  appt_datetime := (NEW.date::text || ' ' || NEW.time::text)::timestamptz;

  -- Parse reminder intervals (e.g. '24h' -> '24 hours', '2h' -> '2 hours', '30m' -> '30 minutes')
  reminder_1_interval := (regexp_replace(config.first_reminder, 'h$', ' hours'))::interval;
  reminder_2_interval := (regexp_replace(config.second_reminder, 'h$', ' hours'))::interval;

  -- Delete existing reminders for this appointment
  DELETE FROM scheduled_reminders WHERE appointment_id = NEW.id;

  -- Insert first reminder
  INSERT INTO scheduled_reminders (user_id, appointment_id, contact_name, contact_phone, service_name, appointment_at, send_at, message_text)
  VALUES (
    NEW.user_id, NEW.id, NEW.lead_name, lead_phone, NEW.service,
    appt_datetime,
    appt_datetime - reminder_1_interval,
    COALESCE(NULLIF(config.message_template, ''), 'Olá ' || NEW.lead_name || ', lembramos do seu agendamento para ' || NEW.date || ' às ' || NEW.time || '. Confirma? Responda Sim ou Não.')
  );

  -- Insert second reminder
  INSERT INTO scheduled_reminders (user_id, appointment_id, contact_name, contact_phone, service_name, appointment_at, send_at, message_text)
  VALUES (
    NEW.user_id, NEW.id, NEW.lead_name, lead_phone, NEW.service,
    appt_datetime,
    appt_datetime - reminder_2_interval,
    COALESCE(NULLIF(config.message_template, ''), 'Olá ' || NEW.lead_name || ', seu agendamento é daqui a pouco! ' || NEW.time || '. Confirma presença?')
  );

  RETURN NEW;
END;
$$;

-- Create trigger on appointments
DROP TRIGGER IF EXISTS trg_schedule_reminders ON appointments;
CREATE TRIGGER trg_schedule_reminders
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION schedule_reminders_for_appointment();
