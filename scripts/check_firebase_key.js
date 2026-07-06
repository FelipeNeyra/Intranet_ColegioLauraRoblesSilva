import fetch from 'node-fetch';

const key = 'AIzaSyBTm3RgiULEFRRoogKJsVB7s3bwt5CQqEU';
const email = 'admin1@laurarobles.cl';
const password = 'Admin1234';
const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`;

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const body = await response.text();
  console.log('STATUS', response.status);
  console.log(body);
} catch (error) {
  console.error('ERROR', error);
}
