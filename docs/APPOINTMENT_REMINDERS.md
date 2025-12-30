# ⏰ Appointment Reminders & Notifications

This guide explains how to enable and configure appointment reminders and notifications in the AI Medical Assistant platform.

## 1. Notification Channels
- **Email**: Receive reminders via email.
- **SMS**: Get SMS reminders using Twilio.
- **WhatsApp**: (Planned) WhatsApp reminders via Twilio.
- **All**: Enable all channels for maximum coverage.

## 2. User Configuration
- Enable reminders in your account settings or during appointment creation.
- Select notification type: `email`, `sms`, `whatsapp`, or `all`.
- Provide and verify your phone number for SMS/WhatsApp.
- Ensure your email is up to date.

## 3. Environment Variables
- For SMS/WhatsApp, set up Twilio as described in `TWILIO_SETUP.md`.

## 4. Example: Sending an SMS Reminder
```js
client.messages.create({
  body: 'Reminder: Your appointment is tomorrow at 10am.',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: user.phoneNumber // must be a valid, verified number
});
```

## 5. WhatsApp Reminders (Planned)
- Requires Twilio WhatsApp API approval
- See [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)

## 6. Troubleshooting
- Ensure phone numbers are verified
- Check Twilio Console for delivery status
- Review logs for errors

---
For more details, see the main README.md and TWILIO_SETUP.md.
