
CREATE OR REPLACE FUNCTION public.schedule_reminders_for_appointment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  config reminders_config%ROWTYPE;
  appt_datetime timestamptz;
  reminder_1_interval interval;
  reminder_2_interval interval;
  lead_phone text;
  raw_first text;
  raw_second text;
BEGIN
  -- Se cancelado, apaga lembretes e sai
  IF NEW.status = 'cancelled' THEN
    DELETE FROM scheduled_reminders WHERE appointment_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Em UPDATE: so recriar lembretes se data ou hora mudaram
  IF TG_OP = 'UPDATE' THEN
    IF OLD.date = NEW.date AND OLD.time = NEW.time THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT * INTO config FROM reminders_config WHERE user_id = NEW.user_id AND active = true LIMIT 1;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF NEW.lead_id IS NOT NULL THEN
    SELECT phone INTO lead_phone FROM leads WHERE id = NEW.lead_id;
  END IF;

  IF lead_phone IS NULL OR lead_phone = '' THEN
    RETURN NEW;
  END IF;

  appt_datetime := (NEW.date::text || ' ' || NEW.time::text)::timestamptz;

  raw_first := trim(config.first_reminder);
  raw_second := trim(config.second_reminder);
  
  raw_first := regexp_replace(raw_first, 'm$', ' minutes');
  raw_first := regexp_replace(raw_first, 'h$', ' hours');
  IF raw_first ~ '^\d+$' THEN
    raw_first := raw_first || ' hours';
  END IF;
  
  raw_second := regexp_replace(raw_second, 'm$', ' minutes');
  raw_second := regexp_replace(raw_second, 'h$', ' hours');
  IF raw_second ~ '^\d+$' THEN
    raw_second := raw_second || ' hours';
  END IF;

  reminder_1_interval := raw_first::interval;
  reminder_2_interval := raw_second::interval;

  DELETE FROM scheduled_reminders WHERE appointment_id = NEW.id;

  INSERT INTO scheduled_reminders (user_id, appointment_id, contact_name, contact_phone, service_name, appointment_at, send_at, message_text)
  VALUES (
    NEW.user_id, NEW.id, NEW.lead_name, lead_phone, NEW.service,
    appt_datetime,
    appt_datetime - reminder_1_interval,
    COALESCE(NULLIF(config.message_template, ''), 'Olá ' || NEW.lead_name || ', lembramos do seu agendamento para ' || NEW.date || ' às ' || NEW.time || '. Confirma? Responda Sim ou Não.')
  );

  INSERT INTO scheduled_reminders (user_id, appointment_id, contact_name, contact_phone, service_name, appointment_at, send_at, message_text)
  VALUES (
    NEW.user_id, NEW.id, NEW.lead_name, lead_phone, NEW.service,
    appt_datetime,
    appt_datetime - reminder_2_interval,
    COALESCE(NULLIF(config.message_template, ''), 'Olá ' || NEW.lead_name || ', seu agendamento é daqui a pouco! ' || NEW.time || '. Confirma presença?')
  );

  RETURN NEW;
END;
$function$;
