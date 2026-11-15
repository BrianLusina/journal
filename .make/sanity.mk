############################################################################################################################################################################################################
## Sanity scripts
############################################################################################################################################################################################################

sanity.build.studio: ## Builds the Sanity CMS studio application
	@echo "Building Sanity CMS studio"
	cd studio && bun run build

sanity.run.studio.dev: ## Runs the Sanity CMS studio application in dev mode
	@echo "Running Sanity CMS studio in dev mode"
	cd studio && bun run dev

sanity.run.studio: ## Runs the Sanity CMS studio application in production mode
	@echo "Running Sanity CMS studio in production mode"
	cd studio && bun run start

sanity.deploy.studio: ## Deploys the Sanity CMS studio application, e.g make studio.deploy.studio STUDIO_HOSTNAME=journal
	@echo "Deploying Sanity CMS studio"
	cd studio && bun run deploy --url $(STUDIO_HOSTNAME)

sanity.undeploy.studio: ## Undeploys the Sanity CMS studio application
	@echo "Undeploying Sanity CMS studio"
	cd studio && bun run undeploy

sanity.deploy.studio.graphql: ## Deploys the Sanity CMS studio graphql API
	@echo "Deploying Sanity CMS studio graphql API"
	cd studio && bun run deploy-graphql