// Supabase Edge Function: send-ticket
// Expects JSON body: { booking_id: string, email: string, ticket_pdf_base64?: string }
// Sends an email via Resend (requires RESEND_API_KEY). If no PDF provided, sends plain text content.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const { booking_id, email, ticket_pdf_base64 } = await req.json();
    if (!booking_id || !email) return new Response(JSON.stringify({ error: 'booking_id and email are required' }), { status: 400 });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch basic booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select('booking_id, passenger_name, seat_number, booking_date, trip_id')
      .eq('booking_id', booking_id)
      .single();

    let subject = `Your Ticket ${booking_id}`;
    let html = `<p>Dear ${booking?.passenger_name || 'Passenger'},</p><p>Attached is your ticket.</p><p>Seat: ${booking?.seat_number || ''}</p>`;
    let attachments: Array<{ filename: string; content: string }> = [];
    if (ticket_pdf_base64 && typeof ticket_pdf_base64 === 'string') {
      attachments.push({ filename: `ticket-${booking_id}.pdf`, content: ticket_pdf_base64 });
    }

    if (!resendApiKey) {
      // No mail provider configured; return success for now
      return new Response(JSON.stringify({ ok: true, message: 'Email provider not configured; skipping send.' }), { status: 202, headers: { 'Content-Type': 'application/json' } });
    }

    // Send via Resend
    const payload: Record<string, unknown> = {
      from: 'tickets@your-domain.com',
      to: [email],
      subject,
      html,
    };
    if (attachments.length > 0) {
      // Resend expects attachments as { filename, content }
      (payload as any).attachments = attachments;
    }

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'Email send failed', detail: data }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ ok: true, id: data?.id || null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Unexpected error', detail: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});


