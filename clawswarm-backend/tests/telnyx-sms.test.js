import test from "node:test";
import assert from "node:assert/strict";
import { parseInboundSmsWebhook } from "../integrations/telnyx-sms.js";

test("parseInboundSmsWebhook extracts command text", () => {
  const result = parseInboundSmsWebhook({
    data: {
      event_type: "message.received",
      payload: {
        from: {
          phone_number: "+15555550100"
        },
        text: "confirm"
      }
    }
  });

  assert.equal(result.from, "+15555550100");
  assert.equal(result.text, "confirm");
  assert.equal(result.command, "CONFIRM");
});
