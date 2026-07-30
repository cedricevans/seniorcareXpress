/// <reference path="../pb_data/types.d.ts" />

// ── Service Agreement notification ──────────────────────────────────────────
onRecordAfterCreateSuccess((e) => {
  const r = e.record;
  let formData = {};
  try {
    formData = JSON.parse(r.getString("form_data") || "{}");
  } catch (err) {
    $app.logger().error("Failed to parse service agreement form_data", "error", err);
  }
  const clientName = r.get("client_name") || "Unknown client";
  const clientEmail = r.get("client_email");

  const html = `
    <h2>New Service Agreement Submitted</h2>
    <h3>Client: ${clientName}</h3>
    <table style="border-collapse:collapse;width:100%;">
      <tr><td style="padding:6px;font-weight:bold;width:220px;">Effective Date</td><td style="padding:6px;">${formData.effectiveDate || ""}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Client Address</td><td style="padding:6px;">${formData.clientAddress || ""}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Telephone</td><td style="padding:6px;">${formData.telephone || ""}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Guardian / Responsible Party</td><td style="padding:6px;">${formData.guardianName || ""} (${formData.guardianRelationship || ""})</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Start of Care Date</td><td style="padding:6px;">${formData.startOfCareDate || ""}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Hourly Rate</td><td style="padding:6px;">$${formData.hourlyRate || ""}</td></tr>
      <tr><td style="padding:6px;font-weight:bold;">Payment Type</td><td style="padding:6px;">${formData.paymentType || ""}</td></tr>
    </table>
    <p style="margin-top:20px;color:#666;">Log in to the PocketBase admin panel to view the full agreement record (service_agreements collection).</p>
  `;

  const officeMessage = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: $app.settings().meta.senderName,
    },
    to: [
      { address: "info@seniorcarexpress.com" },
      { address: "bassdebi@gmail.com" },
      { address: "cedric.evans@gmail.com" },
    ],
    subject: "New Service Agreement Submitted — " + clientName,
    html: html,
  });

  let emailSent = false;
  try {
    $app.newMailClient().send(officeMessage);
    emailSent = true;
  } catch (err) {
    $app.logger().error("Failed to send service agreement office email", "error", err);
  }

  if (clientEmail) {
    const clientHtml = `
      <h2>Thank you, ${clientName}!</h2>
      <p>We've received your Service Agreement submission to SeniorCare Xpress. A copy of your responses is attached for your records.</p>
      <p>Our team will review the agreement and follow up shortly. If you have questions in the meantime, call us at <strong>513.687.7866</strong>.</p>
    `;
    const clientMessage = new MailerMessage({
      from: {
        address: $app.settings().meta.senderAddress,
        name: $app.settings().meta.senderName,
      },
      to: [{ address: clientEmail }],
      subject: "Your SeniorCare Xpress Service Agreement",
      html: clientHtml,
    });
    try {
      $app.newMailClient().send(clientMessage);
    } catch (err) {
      $app.logger().error("Failed to send service agreement client confirmation email", "error", err);
    }
  }

  try {
    r.set("email_sent", emailSent);
    $app.save(r);
  } catch (err) {
    $app.logger().error("Failed to update email_sent flag", "error", err);
  }

  e.next();
}, "service_agreements");
