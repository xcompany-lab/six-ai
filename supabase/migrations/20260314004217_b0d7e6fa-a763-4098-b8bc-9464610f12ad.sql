CREATE POLICY "Users can delete own reminders"
ON scheduled_reminders FOR DELETE TO authenticated
USING (auth.uid() = user_id);