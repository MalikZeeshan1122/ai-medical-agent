import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'http://localhost:54321';

export const handlers = [
  // Mock Supabase Auth endpoints
  http.post(`${SUPABASE_URL}/auth/v1/signup`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
      },
    });
  }),

  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
      },
    });
  }),

  // Mock chat edge function
  http.post(`${SUPABASE_URL}/functions/v1/chat`, async () => {
    // Simulate streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const messages = [
          'I understand you have concerns about your health. ',
          'Can you tell me more about your symptoms? ',
          'When did they start?',
        ];
        
        messages.forEach((msg, index) => {
          setTimeout(() => {
            controller.enqueue(encoder.encode(msg));
            if (index === messages.length - 1) {
              controller.close();
            }
          }, index * 100);
        });
      },
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }),

  // Mock appointments query
  http.get(`${SUPABASE_URL}/rest/v1/appointments`, () => {
    return HttpResponse.json([
      {
        id: '1',
        doctor_name: 'Dr. Smith',
        appointment_date: '2025-12-01',
        appointment_time: '10:00',
        reason: 'Annual checkup',
        status: 'scheduled',
      },
    ]);
  }),

  // Mock doctors query
  http.get(`${SUPABASE_URL}/rest/v1/doctors`, () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'Dr. Jane Smith',
        specialty: 'Cardiology',
        average_rating: 4.8,
        is_accepting_patients: true,
      },
      {
        id: '2',
        name: 'Dr. John Doe',
        specialty: 'Dermatology',
        average_rating: 4.5,
        is_accepting_patients: true,
      },
    ]);
  }),

  // Mock hospitals query
  http.get(`${SUPABASE_URL}/rest/v1/hospitals`, () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'City General Hospital',
        address: '123 Main St',
        phone: '555-0123',
      },
    ]);
  }),
];
