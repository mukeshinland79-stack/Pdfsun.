import assert from "node:assert/strict";
import {
  validateSupportInquiryInput,
  generateSupportTicketId,
} from "../server/supportStore";

// 1. Valid inquiry input & sanitization
const validResult = validateSupportInquiryInput({
  name: "  Aarav Sharma \u0007 ",
  email: "  Aarav@Example.COM ",
  subject: "  PDF to Word formatting help  ",
  message: "Hello team,\nMy PDF table shifted columns when converting to DOCX.",
});

assert.equal(validResult.ok, true, "Valid inquiry should pass validation");
if (validResult.ok) {
  assert.equal(validResult.data.name, "Aarav Sharma");
  assert.equal(validResult.data.email, "aarav@example.com");
  assert.equal(validResult.data.subject, "PDF to Word formatting help");
  assert.ok(validResult.data.message.includes("My PDF table shifted columns"));
}

// 2. Reject invalid / malformed inputs
assert.equal(
  validateSupportInquiryInput({
    name: "A",
    email: "valid@example.com",
    subject: "Help needed",
    message: "This is a valid message body.",
  }).ok,
  false,
  "Name shorter than 2 chars must fail"
);

assert.equal(
  validateSupportInquiryInput({
    name: "Aarav",
    email: "not-an-email",
    subject: "Help needed",
    message: "This is a valid message body.",
  }).ok,
  false,
  "Invalid email must fail"
);

assert.equal(
  validateSupportInquiryInput({
    name: "Aarav",
    email: "valid@example.com",
    subject: "Help needed",
    message: "Too short",
  }).ok,
  false,
  "Message shorter than 10 chars must fail"
);

assert.equal(
  validateSupportInquiryInput({
    name: { $gt: "" },
    email: "valid@example.com",
    subject: "Help needed",
    message: "This is a valid message body.",
  }).ok,
  false,
  "Non-string payload injection must fail"
);

// 3. Server-generated Ticket ID format & uniqueness
const t1 = generateSupportTicketId();
const t2 = generateSupportTicketId();
assert.match(t1, /^#PDFSUN-[0-9A-F]{6}$/);
assert.match(t2, /^#PDFSUN-[0-9A-F]{6}$/);
assert.notEqual(t1, t2);

console.log("✅ [Support Contact Tests] All validation, sanitization, and ticket ID assertions passed.");
