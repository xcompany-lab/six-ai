ALTER TABLE leads ADD COLUMN human_takeover_until timestamptz DEFAULT NULL;
ALTER TABLE ai_agent_config ADD COLUMN human_takeover_minutes integer NOT NULL DEFAULT 30;