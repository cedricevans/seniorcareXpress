/// <reference path="../pb_data/types.d.ts" />

// ── Veterans Inquiry notification ──────────────────────────────────────────
onRecordAfterCreateSuccess((e) => {
  const r = e.record;
  const html = `
    <h2>New Veterans Aid & Attendance Inquiry</h2>
    <p><strong>Name:</strong> ${r.get("full_name")}</p>
    <p><strong>Email:</strong> ${r.get("email")}</p>
    <p><strong>Phone:</strong> ${r.get("phone")}</p>
    <p><strong>Veteran Status:</strong> ${r.get("veteran_status")}</p>
    <p><strong>Service Era:</strong> ${r.get("service_era")}</p>
    <p><strong>90-Day Service:</strong> ${r.get("service_length")}</p>
    <p><strong>Needs ADL Help:</strong> ${r.get("care_needs")}</p>
    <p><strong>Living Situation:</strong> ${r.get("living_situation")}</p>
    <p><strong>Additional Info:</strong> ${r.get("additional_info") || "N/A"}</p>
  `;

  const message = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: $app.settings().meta.senderName,
    },
    to: [{ address: "1bassdebi@gmail.com" }],
    subject: "New Veterans Aid & Attendance Inquiry — " + r.get("full_name"),
    html: html,
  });

  try {
    $app.newMailClient().send(message);
  } catch (err) {
    $app.logger().error("Failed to send veterans inquiry email", "error", err);
  }

  e.next();
}, "veterans_inquiries");
