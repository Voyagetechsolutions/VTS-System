describe('E2E: driver shifts → HR payroll → ops performance', () => {
  it('creates shift, payroll, and verifies KPIs endpoints work', () => {
    const supabaseUrl = Cypress.env('SUPABASE_URL');
    const supabaseKey = Cypress.env('SUPABASE_ANON_KEY');
    const companyId = Cypress.env('TEST_COMPANY_ID');

    expect(supabaseUrl).to.be.a('string').and.not.be.empty;
    expect(supabaseKey).to.be.a('string').and.not.be.empty;
    expect(companyId).to.be.a('string').and.not.be.empty;

    cy.wrap(null).then(async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(supabaseUrl, supabaseKey);

      // Create a staff shift
      const { error: shiftErr } = await sb
        .from('staff_shifts')
        .insert([{ company_id: companyId, staff_id: null, start_time: new Date().toISOString(), end_time: new Date(Date.now()+3600000).toISOString(), role: 'driver' }]);
      if (shiftErr) throw new Error('shift create failed: ' + shiftErr.message);

      // Create payroll row
      const { error: payrollErr } = await sb
        .from('payroll')
        .insert([{ company_id: companyId, staff_id: null, period: '2025-09', base: 1000, overtime: 50, bonus: 0, deductions: 0, net_pay: 1050, status: 'pending_approval' }]);
      if (payrollErr) throw new Error('payroll insert failed: ' + payrollErr.message);

      // Validate finance KPIs RPC
      const { data: kpis, error: kpisErr } = await sb.rpc('finance_kpis', { p_company_id: companyId });
      if (kpisErr) throw new Error('finance_kpis failed: ' + kpisErr.message);
      if (!Array.isArray(kpis)) throw new Error('finance_kpis returned wrong type');
    });
  });
});


