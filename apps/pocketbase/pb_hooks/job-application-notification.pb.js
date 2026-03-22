/// <reference path="../pb_data/types.d.ts" />

// ── Job Application notification ────────────────────────────────────────────
onRecordAfterCreateSuccess((e) => {
  const r = e.record;
  const name = `${r.get("first_name") || ""} ${r.get("last_name") || ""}`.trim();
  const html = `
    <h2>New Employment Application Received</h2>
    <h3>Applicant: ${name}</h3>
    <table style="border-collapse:collapse;width:100%;">
      <tr><td style="padding:6px;font-weight:bold;width:200px;">Email</td><td style="padding:6px;">${r.get("email")}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Cell Phone</td><td style="padding:6px;">${r.get("cell_phone")}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Address</td><td style="padding:6px;">${r.get("address")}, ${r.get("city_state")} ${r.get("zip_code")}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Work Authorization</td><td style="padding:6px;">${r.get("work_authorization")}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Worked Here Before</td><td style="padding:6px;">${r.get("worked_before")}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Currently Employed</td><td style="padding:6px;">${r.get("currently_employed")}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Education Level</td><td style="padding:6px;">${r.get("education_level")}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Institution</td><td style="padding:6px;">${r.get("institution")}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Criminal Record</td><td style="padding:6px;">${r.get("criminal_record")}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">How Heard</td><td style="padding:6px;">${r.get("how_heard")}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Statement Agreed</td><td style="padding:6px;">${r.get("statement_agreed")}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Signature</td><td style="padding:6px;">${r.get("signature_first")} ${r.get("signature_last")}</td></tr>
    </table>
    <p style="margin-top:20px;color:#666;">Log in to the PocketBase admin panel to view the full application details and resume attachment.</p>
  `;

  const message = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: $app.settings().meta.senderName,
    },
    to: [{ address: "1bassdebi@gmail.com" }],
    subject: "New Job Application — " + name,
    html: html,
  });

  try {
    $app.newMailClient().send(message);
  } catch (err) {
    $app.logger().error("Failed to send job application email", "error", err);
  }

  e.next();
}, "job_applications");
