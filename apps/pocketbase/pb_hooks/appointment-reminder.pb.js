/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  // This hook runs after an appointment is created
  // In a production system, you would use a cron job to check for appointments 24 hours before
  // For now, this demonstrates the email sending capability
  e.next();
}, "appointments");

// Cron job to send reminders 24 hours before appointments
cronAdd("appointment_reminder_24h", "0 9 * * *", () => {
  try {
    // Get tomorrow's date
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Find all appointments scheduled for tomorrow with status 'scheduled' and reminder not sent
    const appointments = $app.findAllRecords("appointments", {
      filter: "appointment_date = '" + tomorrowStr + "' && status = 'scheduled' && reminder_sent = false"
    });
    
    appointments.forEach((appointment) => {
      try {
        // Get patient details
        const patient = $app.findRecordById("patients", appointment.get("patient_id"));
        
        // Get caregiver details
        const caregiver = $app.findRecordById("users", appointment.get("caregiver_id"));
        
        // Get family members linked to this patient
        const familyLinks = $app.findAllRecords("family_links", {
          filter: "patient_id = '" + patient.id + "'"
        });
        
        // Collect family member emails
        const familyEmails = [];
        familyLinks.forEach((link) => {
          const familyUser = $app.findRecordById("users", link.get("family_user_id"));
          if (familyUser && familyUser.get("email")) {
            familyEmails.push({ address: familyUser.get("email") });
          }
        });
        
        // Send email to family members
        if (familyEmails.length > 0) {
          const appointmentDate = appointment.get("appointment_date");
          const appointmentTime = appointment.get("appointment_time");
          const caregiverName = caregiver.get("name") || caregiver.get("email");
          const patientName = patient.get("name");
          
          const message = new MailerMessage({
            from: {
              address: $app.settings().meta.senderAddress,
              name: $app.settings().meta.senderName
            },
            to: familyEmails,
            subject: "Appointment Reminder: " + patientName + " with " + caregiverName,
            html: "<h2>Appointment Reminder</h2>" +
                  "<p>Dear Family,</p>" +
                  "<p>This is a reminder that <strong>" + patientName + "</strong> has an appointment scheduled for:</p>" +
                  "<p><strong>Date:</strong> " + appointmentDate + "</p>" +
                  "<p><strong>Time:</strong> " + appointmentTime + "</p>" +
                  "<p><strong>Caregiver:</strong> " + caregiverName + "</p>" +
                  (appointment.get("notes") ? "<p><strong>Notes:</strong> " + appointment.get("notes") + "</p>" : "") +
                  "<p>Please ensure the patient is ready for the appointment.</p>" +
                  "<p>Best regards,<br>Care Management System</p>"
          });
          
          $app.newMailClient().send(message);
        }
        
        // Mark reminder as sent
        appointment.set("reminder_sent", true);
        $app.save(appointment);
      } catch (err) {
        console.log("Error processing appointment reminder: " + err.message);
      }
    });
  } catch (err) {
    console.log("Error in appointment reminder cron: " + err.message);
  }
});