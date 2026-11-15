# Reference: https://vercel.com/docs/cli/dev
.PHONY: vercel.dev
vercel.dev: ## Starts up Vercel in dev mode locally
	bun vercel:dev
