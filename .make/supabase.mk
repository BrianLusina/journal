############################################################################################################################################################################################################
## Supabase commands
############################################################################################################################################################################################################

.PHONY: supabase.link
supabase.link: ## link project to remote supabase, usage: make supabase.link SUPABASE_PROJECT_ID 12345
	@echo "${GREEN} linking supabase project to remote"
	bun supabase:link --project-ref $(SUPABASE_PROJECT_ID)
	@echo "${GREEN} Done linking supabase project"

.PHONY: supabase.gen.types
supabase.gen.types: ## generates supabase types, usage: make subapase.gen.types SUPABASE_PROJECT_ID 12345
	@echo "${GREEN} generating supabase types"
	bun supabase:gen:types --project-id $(SUPABASE_PROJECT_ID)
	@echo "${GREEN} Done generating supabase"

.PHONY: supabase.function.deploy
supabase.function.deploy: ## deploys supabase function, usage make subapase.function.deploy SUAPBASE_PROJECT_ID=12345
	@echo "${GREEN} deploying supabase function $(SUPABASE_FUNC_DIR)"
	bun supabase:function:deploy $(SUPABASE_FUNC_DIR) --project-ref $(SUPABASE_PROJECT_ID)
	@echo "${GREEN} Done deploying function $(SUPABASE_FUNC_DIR) to supabase"

.PHONY: supabase.function.serve
supabase.function.serve: ## serve supabase function, usage: make subapase-function-serve
	@echo "${GREEN} serving supabase functions"
	bun supabase:function:serve

.PHONY: supabase.start
supabase.start: ## starts supabase
	@echo "${GREEN} starting supabase"
	bun supabase:start

.PHONY: supabase.stop
supabase.stop: ## stops supabase
	@echo "${GREEN} stopping supabase"
	bun supabase:stop

.PHONY: supabase.migrate
supabase.migrate: ## runs supabase migration
	@echo "${GREEN} running supabase migration"
	bun supabase:migrate
	@echo "${GREEN} done running supabase migration"

.PHONY: supabase.migrate.new
supabase.migrate.new: ## creates a new supabase migration file, usage: make supabase.migrate.new add_department_column
	@echo "${GREEN} creating new supabase migration"
	bun supabase:migrate:new $(SUPABASE_MIGRATION_FILE)
	@echo "${GREEN} done creating new supabase migration file"

.PHONY: supabase.migrate.repair
supabase.migrate.repair: confirm ## repairs supabase migration history table, usage: make supabase.migrate.repair 20260306080105
	@echo "${GREEN} reparing supabase migration history"
	bun supabase:migrate:repair $(SUPABASE_MIGRATION_HISTORY)
	@echo "${GREEN} done reparing supabase migration history"

.PHONY: supabase.migrate.list
supabase.migrate.list: ## lists supabase migration history table, usage: make supabase.migrate.list
	@echo "${GREEN} reparing supabase migration list"
	bun supabase:migrate:list
	@echo "${GREEN} done reparing supabase migration list"

.PHONY: supabase.db.push
supabase.db.push: confirm ## pushes migrations to remote database
	@echo "${GREEN} pushes migrations to remote database"
	bun supabase:db:push
	@echo "${GREEN} done pushing migrations to remote"

.PHONY: supabase.db.pull
supabase.db.pull: confirm ## pull migrations from remote database
	@echo "${GREEN} pulling migrations from remote database"
	bun supabase:db:pull
	@echo "${GREEN} done pulling migrations from remote"
