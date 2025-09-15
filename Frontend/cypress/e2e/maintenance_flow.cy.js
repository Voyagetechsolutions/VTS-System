describe('E2E: maintenance → admin approval → fleet update', () => {
  it('creates maintenance task and updates status via RPCs', () => {
    const supabaseUrl = Cypress.env('SUPABASE_URL');
    const supabaseKey = Cypress.env('SUPABASE_ANON_KEY');
    const companyId = Cypress.env('TEST_COMPANY_ID');

    expect(supabaseUrl).to.be.a('string').and.not.be.empty;
    expect(supabaseKey).to.be.a('string').and.not.be.empty;
    expect(companyId).to.be.a('string').and.not.be.empty;

    cy.wrap(null).then(async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(supabaseUrl, supabaseKey);

      // Create a maintenance request
      const { data: req, error: reqErr } = await sb
        .from('maintenance_requests')
        .insert([{ company_id: companyId, bus_id: null, work_type: 'inspection', description: 'E2E auto', status: 'pending_approval' }])
        .select('*')
        .maybeSingle();
      if (reqErr) throw new Error('maintenance request failed: ' + reqErr.message);

      // Simulate admin approval
      const { error: updErr } = await sb
        .from('maintenance_requests')
        .update({ status: 'approved' })
        .eq('request_id', req.request_id);
      if (updErr) throw new Error('approval failed: ' + updErr.message);

      // Create maintenance task for fleet update
      const { data: task, error: taskErr } = await sb
        .from('maintenance_tasks')
        .insert([{ company_id: companyId, title: 'Inspection', priority: 'low', status: 'open' }])
        .select('*')
        .maybeSingle();
      if (taskErr) throw new Error('create task failed: ' + taskErr.message);

      // Mark complete with costs
      const { error: doneErr } = await sb
        .from('maintenance_tasks')
        .update({ status: 'completed', labor_hours: 1, labor_rate: 20, parts_cost: 10, total_cost: 30 })
        .eq('id', task.id);
      if (doneErr) throw new Error('complete task failed: ' + doneErr.message);
    });
  });
});


