.PHONY: dev backend frontend adk sidecar

# Start all three services (ADK API, sidecar, Vite) with one Ctrl-C to kill all.
dev:
	@trap 'kill 0' EXIT INT TERM; \
	.venv/bin/adk api_server --allow_origins='*' --port 8010 . & \
	.venv/bin/uvicorn web_backend.server:app --port 8002 --reload & \
	(cd web && pnpm dev) & \
	wait

# Backends only (when iterating on UI separately).
backend:
	@trap 'kill 0' EXIT INT TERM; \
	.venv/bin/adk api_server --allow_origins='*' --port 8010 . & \
	.venv/bin/uvicorn web_backend.server:app --port 8002 --reload & \
	wait

adk:
	.venv/bin/adk api_server --allow_origins='*' --port 8010 .

sidecar:
	.venv/bin/uvicorn web_backend.server:app --port 8002 --reload

frontend:
	cd web && pnpm dev
