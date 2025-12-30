# 📞 Twilio Integration Setup Guide

This guide explains how to enable and configure Twilio for SMS, voice, and WhatsApp notifications in the AI Medical Assistant platform.

## 1. Why Twilio?
- **SMS Appointment Reminders**: Send automated reminders to patients.
- **Voice Call Notifications**: Trigger voice calls for emergencies or critical updates.
- **Two-Factor Authentication (2FA)**: Secure user login with SMS codes.
- **WhatsApp Notifications**: (Planned) Send appointment reminders via WhatsApp.

## 2. Prerequisites
- Twilio account ([Sign up](https://www.twilio.com/))
- Twilio phone number
- Access to your Twilio Console for API keys

## 3. Required Environment Variables
Add these to your `.env` file:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

## 4. Basic Node.js Usage Example
```js
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send SMS
client.messages.create({
  body: 'Your appointment is scheduled for tomorrow at 10am.',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: '+1234567890'
});

// Make a voice call
client.calls.create({
  url: 'http://demo.twilio.com/docs/voice.xml',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: '+1234567890'
});
```

## 5. WhatsApp Setup (Planned)
- Apply for WhatsApp access in Twilio Console
- Add WhatsApp-enabled number
- Update `.env` and code as needed

## 6. Documentation
- [Twilio SMS API](https://www.twilio.com/docs/sms/send-messages)
- [Twilio Voice API](https://www.twilio.com/docs/voice/make-calls)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)

## 7. Troubleshooting
- Ensure all environment variables are set
- Check Twilio Console for errors and logs
- Verify phone numbers are in E.164 format

---
For advanced integration, see the official Twilio docs and future project releases.
