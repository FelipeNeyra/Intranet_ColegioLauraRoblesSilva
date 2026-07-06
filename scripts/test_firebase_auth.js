(async () => {
  try {
    const envRes = await fetch('http://localhost:3000/api/env');
    const env = await envRes.json();
    console.log('env keys present:', Object.keys(env));
    const key = env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!key) {
      console.error('No API key in /api/env');
      process.exit(1);
    }

    const email = 'admin1@laurarobles.cl';
    const password = 'Admin1234';

    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`;
    const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`;

    console.log('Attempting sign-in for', email);
    let r = await fetch(signInUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    let t = await r.json();
    if (r.ok) {
      console.log('Signed in OK:', t);
      return;
    }
    console.log('Sign-in error:', t);

    if (t && t.error && t.error.message && t.error.message.includes('EMAIL_NOT_FOUND')) {
      console.log('User not found; creating via REST signUp');
      let c = await fetch(signUpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });
      let ct = await c.json();
      console.log('Sign-up response:', ct);
      if (!c.ok) {
        console.error('Signup failed');
        process.exit(1);
      }
      // try sign-in again
      let r2 = await fetch(signInUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });
      console.log('Sign-in after signup:', await r2.json());
    } else {
      console.error('Unhandled sign-in error, aborting');
      process.exit(1);
    }
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
