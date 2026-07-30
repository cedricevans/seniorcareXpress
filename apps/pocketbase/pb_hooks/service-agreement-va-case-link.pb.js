/// <reference path="../pb_data/types.d.ts" />

// ── Link Service Agreement clients into the VA case pool ────────────────────
// So a client who only ever submitted a Service Agreement (never went through
// VA Intake) still shows up as a selectable profile in the VA form picker.
// service_agreements has no SSN/DOB/VA file number — only what the client
// actually gave us (name, address, phone, email) — those fields stay blank
// until someone fills them in via VA Intake or a form page.
onRecordAfterCreateSuccess((e) => {
  const r = e.record;
  const clientName = (r.get("client_name") || "").trim();
  if (!clientName) {
    e.next();
    return;
  }

  let formData = {};
  try {
    formData = JSON.parse(r.getString("form_data") || "{}");
  } catch (err) {
    $app.logger().error("Failed to parse service agreement form_data", "error", err);
  }
  const nameParts = clientName.split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  const phone = (formData.telephone || "").replace(/\D/g, "");

  try {
    const collection = $app.findCollectionByNameOrId("va_cases");
    const record = new Record(collection);
    record.set("applicant_type", "veteran");
    record.set("first_name", firstName);
    record.set("last_name", lastName);
    record.set("status", "intake");
    record.set("veteran_first_name", firstName);
    record.set("veteran_last_name", lastName);
    record.set("mailing_address_street", formData.clientAddress || "");
    record.set("phone_area", phone.slice(0, 3));
    record.set("phone_mid", phone.slice(3, 6));
    record.set("phone_last4", phone.slice(6, 10));
    record.set("email", r.get("client_email") || "");
    $app.save(record);
  } catch (err) {
    $app.logger().error("Failed to create linked va_cases record for service agreement client", "error", err);
  }

  e.next();
}, "service_agreements");
