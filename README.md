# Storyflow ADK Agents

Small Google ADK examples for workflow-style agents.

## Agents

- `my_agent`: routes a message into bug, customer support, or logistics paths.
- `hitl_agent`: extracts a refund request, analyzes the refund decision, and requests human approval for large approved refunds.

## Setup

Create and activate a virtual environment, then install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Copy the example environment file into each agent directory and add your local credentials:

```bash
cp .env.example my_agent/.env
cp .env.example hitl_agent/.env
```

## Run

Start ADK from the repository root:

```bash
adk web
```

Then choose `my_agent` or `hitl_agent` in the ADK web UI.

## Test

```bash
python -m unittest discover -s tests -v
```

## Notes

Local environment files, ADK session databases, virtual environments, and Python cache files are intentionally ignored by git.
