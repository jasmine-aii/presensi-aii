// Supabase Edge Function: create-employee
// Creates a login account for a new employee. Only callable by an admin.
// The service-role key is injected by Supabase at runtime — it never leaves
// the server, so account creation stays secure.
//
// Deploy:  supabase functions deploy create-employee
//   (or paste this into Dashboard → Edge Functions → create "create-employee")

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1. Verify the caller is a signed-in admin.
    const authHeader = req.headers.get('Authorization') ?? '';
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uErr } = await caller.auth.getUser();
    if (uErr || !user) return json({ error: 'Not authenticated' });
    const { data: prof } = await caller.from('profiles').select('role').eq('id', user.id).single();
    if (prof?.role !== 'admin') return json({ error: 'Hanya admin yang dapat mengelola akun.' });

    const body = await req.json();
    const admin = createClient(url, serviceKey);

    // Action: permanently delete an employee account. Cascades to their
    // profile, attendance and leave rows (FKs are on delete cascade).
    if (body.action === 'delete') {
      const { userId } = body;
      if (!userId) return json({ error: 'userId wajib diisi.' });
      if (String(userId) === user.id) return json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
      const { error: dErr } = await admin.auth.admin.deleteUser(String(userId));
      if (dErr) return json({ error: dErr.message });
      return json({ ok: true });
    }

    // Action: reset an existing employee's password.
    if (body.action === 'reset-password') {
      const { userId, password } = body;
      if (!userId || !password) return json({ error: 'userId dan kata sandi wajib diisi.' });
      if (String(password).length < 6) return json({ error: 'Kata sandi minimal 6 karakter.' });
      const { error: rErr } = await admin.auth.admin.updateUserById(String(userId), { password: String(password) });
      if (rErr) return json({ error: rErr.message });
      return json({ ok: true });
    }

    // Default action: create a new employee account.
    const { email, password, full_name, job_role, access_role, shift, birth_date } = body;
    if (!email || !password) return json({ error: 'Email dan kata sandi wajib diisi.' });
    if (String(password).length < 6) return json({ error: 'Kata sandi minimal 6 karakter.' });

    // Create the auth user with the service role. email_confirm skips the
    // confirmation email so the employee can sign in immediately.
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: String(email).trim(),
      password: String(password),
      email_confirm: true,
      user_metadata: { full_name: full_name ?? '', department: job_role ?? '' },
    });
    if (cErr) return json({ error: cErr.message });

    // 4. The handle_new_user trigger created the profile (name, department,
    //    auto employee_id). Set the access role + shift on it.
    await admin
      .from('profiles')
      .update({ role: access_role === 'admin' ? 'admin' : 'employee', shift: shift ?? null, birth_date: birth_date || null })
      .eq('id', created.user.id);

    return json({ ok: true, userId: created.user.id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
