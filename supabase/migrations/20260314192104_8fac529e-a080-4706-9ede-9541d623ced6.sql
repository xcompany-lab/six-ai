ALTER TABLE leads ADD COLUMN ai_stopped boolean NOT NULL DEFAULT false;
ALTER TABLE ai_agent_config ADD COLUMN stop_command text NOT NULL DEFAULT '/parar';
ALTER TABLE ai_agent_config ADD COLUMN activate_command text NOT NULL DEFAULT '/ativar';