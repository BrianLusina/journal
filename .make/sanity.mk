############################################################################################################################################################################################################
## Sanity scripts
############################################################################################################################################################################################################

sanity.build.studio: ## Builds the Sanity CMS studio application e.g. make sanity.build.studio
	@echo "Building Sanity CMS studio"
	cd studio && bun run build

sanity.run.studio.dev: ## Runs the Sanity CMS studio application in dev mode e.g. make sanity.run.studio.dev
	@echo "Running Sanity CMS studio in dev mode"
	cd studio && bun run dev

sanity.run.studio: ## Runs the Sanity CMS studio application in production mode e.g. make sanity.run.studio
	@echo "Running Sanity CMS studio in production mode"
	cd studio && bun run start

sanity.deploy.studio: ## Deploys the Sanity CMS studio application, e.g make sanity.deploy.studio STUDIO_HOSTNAME=journal
	@echo "Deploying Sanity CMS studio"
	cd studio && bun run deploy --url $(STUDIO_HOSTNAME)

sanity.undeploy.studio: ## Undeploys the Sanity CMS studio application e.g make sanity.undeploy.studio
	@echo "Undeploying Sanity CMS studio"
	cd studio && bun run undeploy

sanity.deploy.studio.graphql: ## Deploys the Sanity CMS studio graphql API e.g make sanity.deploy.studio.graphql
	@echo "Deploying Sanity CMS studio graphql API"
	cd studio && bun run deploy-graphql