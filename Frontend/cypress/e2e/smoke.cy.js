describe('VTS E2E (Programmatic via Supabase)', () => {
  it('Create Booking → Mark Paid → Verify', () => {
    const supabaseUrl = Cypress.env('SUPABASE_URL');
    const supabaseKey = Cypress.env('SUPABASE_ANON_KEY');
    const companyId = Cypress.env('TEST_COMPANY_ID');
    const tripId = Cypress.env('TEST_TRIP_ID');
    const passengerName = `E2E Tester ${Date.now()}`;

    expect(supabaseUrl, 'SUPABASE_URL').to.be.a('string').and.not.be.empty;
    expect(supabaseKey, 'SUPABASE_ANON_KEY').to.be.a('string').and.not.be.empty;
    expect(companyId, 'TEST_COMPANY_ID').to.be.a('string').and.not.be.empty;
    expect(tripId, 'TEST_TRIP_ID').to.be.a('string').and.not.be.empty;

    cy.wrap(null).then(async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(supabaseUrl, supabaseKey);

      // Create booking via RPC (function create_booking)
      const { data: bookingId, error: bookErr } = await sb.rpc('create_booking', {
        p_trip_id: tripId,
        p_company_id: companyId,
        p_passenger_name: passengerName,
        p_phone: null,
        p_id_number: null,
        p_seat_number: 1,
        p_payment_status: 'unpaid',
        p_source: 'e2e'
      });
      if (bookErr) throw new Error('create_booking failed: ' + bookErr.message);

      // Record payment via RPC
      const { error: payErr } = await sb.rpc('record_payment', { p_booking_id: bookingId, p_method: 'card', p_amount: 100 });
      if (payErr) throw new Error('record_payment failed: ' + payErr.message);

      // Verify paid
      const { data: paidCheck, error: paidErr } = await sb
        .from('payments')
        .select('booking_id, status')
        .eq('booking_id', bookingId)
        .maybeSingle();
      if (paidErr) throw new Error('verify payment failed: ' + paidErr.message);
      if (!paidCheck) throw new Error('no payment row found');
      if ((paidCheck.status || '').toLowerCase() !== 'paid') throw new Error('payment status not paid');
    });
  });
});

