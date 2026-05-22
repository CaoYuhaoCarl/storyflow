from google.adk import Agent, Workflow, Context
from google.adk.events import RequestInput
from google.adk.workflow import node
from google.genai import types
from pydantic import BaseModel, Field

class RefundRequest(BaseModel):
    customer_id: str = Field(description="Customer ID, 'unknown' if not provided")
    amount_usd: float = Field(description="Amount in USD")
    reason: str = Field(description="Reason for refund")

class RefundDecision(BaseModel):
    approved: bool
    amount_usd: float
    reason: str


def _decision_from_output(value) -> RefundDecision:
    if isinstance(value, RefundDecision):
        return value
    if isinstance(value, types.Content):
        text = "".join(
            part.text
            for part in value.parts or []
            if part.text and not getattr(part, "thought", False)
        )
        return RefundDecision.model_validate_json(text)
    return RefundDecision.model_validate(value)


def _approval_response_to_text(response) -> str:
    if isinstance(response, dict) and "result" in response:
        response = response["result"]
    return str(response).strip().lower()


extractor = Agent(
    name="extractor",
    model="gemini-flash-latest",
    output_schema=RefundRequest,
    instruction="Extract the refund details from the text. Ensure amount_usd is a float."
)

refund_analyzer = Agent(
    name="refund_analyzer",
    model="gemini-flash-latest",
    output_schema=RefundDecision,
    instruction="Decide whether to approve the refund. Keep amount_usd as a float."
)


@node(name="process_refund")
def process_refund(node_input: RefundDecision):
    decision = node_input
    if decision.approved:
        return f"Refund processed successfully for ${decision.amount_usd}. TxID: FAKE_TX_123. Reason: {decision.reason}"
    else:
        return f"Refund denied. Reason: {decision.reason}"


@node(name="request_refund_approval", rerun_on_resume=False)
async def request_refund_approval(node_input: RefundDecision):
    yield RequestInput(
        message=f"Large refund of ${node_input.amount_usd} requested. Approve? (yes/no)",
        payload=node_input.model_dump(mode="json"),
        response_schema=str,
    )


@node(name="refund_workflow", rerun_on_resume=True)
async def refund_workflow(ctx: Context, node_input: str):
    request_obj = await ctx.run_node(extractor, node_input)
    decision_raw = await ctx.run_node(refund_analyzer, request_obj)
    decision = _decision_from_output(decision_raw)

    if decision.approved and decision.amount_usd > 100:
        while True:
            human_input = _approval_response_to_text(
                await ctx.run_node(request_refund_approval, decision)
            )

            if human_input == "no":
                decision.approved = False
                decision.reason = "Denied by human reviewer"
                break
            if human_input == "yes":
                decision.approved = True
                decision.reason = "Approved by human reviewer"
                break

    result = await ctx.run_node(process_refund, decision)
    return result

root_agent = Workflow(
    name="root_agent",
    edges=[("START", refund_workflow)]
)
