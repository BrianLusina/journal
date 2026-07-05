############################################################################################################################################################################################################
## Application scripts
############################################################################################################################################################################################################

.PHONY: install
install: ## Installs dependencies
	@echo "${GREEN} installing dependencies"
	bun install

.PHONY: run.dev
run.dev: create.envfile # Run the application
	@echo "Running in dev mode"
	bun dev

.PHONY: build.dev
build.dev: create.envfile # Build the application
	@echo "Building in dev mode"
	bun build:dev

.PHONY: build.prod
build.prod: create.envfile # Build the application for production
	@echo "Building in production mode"
	bun build:prod

.PHONY: test
test: ## runs tests
	@echo "${GREEN} running unit tests"
	bun test
	@echo "${GREEN} Done running unt tests"

.PHONY: storybook.dev
storybook.dev: ## Runs storybook dev server
	@echo "${GREEN} running storybook dev server"
	bun storybook

.PHONY: storybook.build
storybook.build: ## Runs storybook build
	@echo "${GREEN} running storybook build"
	bun storybook:build
	@echo "${GREEN} done building storybook"

.PHONY: lint
lint: ## lints the codebase
	@echo "${GREEN} running lint checks"
	bun lint

.PHONY: lint.styles
lint.styles: ## lints the styles
	@echo "${GREEN} running lint checks for styles"
	bun lint:styles

.PHONY: lint.fix
lint.fix: ## fixes linting issues
	@echo "${GREEN} fixing linting issues"
	bun lint:fix

# Validates codecov yml
validate.codecov: ## Validates codecov yml
	curl --data-binary @codecov.yml https://codecov.io/validate

.PHONY: validate.circleci
scan.frontend: ## Scans frontend dependencies for vulnerabilities
	bun audit --audit-level=critical

.PHONY: scan.licenses
scan.licenses: ## Scans for license violations
	bun scan:licenses