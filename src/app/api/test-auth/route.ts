import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || null;
  if (!key) return NextResponse.json({ error: 'No API key on server' }, { status: 500 });

  const email = 'admin1@laurarobles.cl';
  const password = 'Admin1234';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`;
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`;
  const configUrl = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/config?key=${key}`;

  try {
    const configResponse = await fetch(configUrl, { method: 'GET' });
    const configBody = await configResponse.json();
    if (!configResponse.ok) {
      return NextResponse.json({ ok: false, configurationCheck: configBody, error: 'CONFIGURATION_CHECK_FAILED' });
    }

    let r = await fetch(signInUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const t = await r.json();
    if (r.ok) return NextResponse.json({ signin: t, configuration: configBody });

    if (t && t.error && t.error.message && t.error.message.includes('EMAIL_NOT_FOUND')) {
      // create
      const c = await fetch(signUpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });
      const ct = await c.json();
      if (!c.ok) return NextResponse.json({ signup: ct, configuration: configBody, error: 'SIGNUP_FAILED' }, { status: 500 });
      // try signin again
      const r2 = await fetch(signInUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });
      const t2 = await r2.json();
      return NextResponse.json({ signup: ct, signin_after_signup: t2, configuration: configBody });
    }
    // Return error body with 200 so fetch tools can read response content reliably
    return NextResponse.json({ ok: false, error: t, configuration: configBody });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) });
  }
}
