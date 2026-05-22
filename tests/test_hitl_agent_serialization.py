import json
import unittest

from google.genai import types

from hitl_agent.agent import (
    RefundDecision,
    _approval_response_to_text,
    _decision_from_output,
)


class RefundDecisionSerializationTest(unittest.TestCase):
    def test_decision_output_value_is_json_serializable_and_restorable(self):
        decision = RefundDecision(
            approved=True,
            amount_usd=50.0,
            reason="service down",
        )

        output_value = decision.model_dump(mode="json")

        self.assertIsInstance(output_value, dict)
        json.dumps({"decision": output_value})
        self.assertEqual(_decision_from_output(output_value), decision)

    def test_decision_content_output_is_restorable_after_resume(self):
        content = types.Content(
            role="model",
            parts=[
                types.Part(
                    text='{"approved":true,"amount_usd":640.0,"reason":"service down"}'
                )
            ],
        )

        self.assertEqual(
            _decision_from_output(content),
            RefundDecision(
                approved=True,
                amount_usd=640.0,
                reason="service down",
            ),
        )

    def test_approval_response_text_is_normalized(self):
        self.assertEqual(_approval_response_to_text(" YES "), "yes")
        self.assertEqual(_approval_response_to_text({"result": "no"}), "no")


if __name__ == "__main__":
    unittest.main()
