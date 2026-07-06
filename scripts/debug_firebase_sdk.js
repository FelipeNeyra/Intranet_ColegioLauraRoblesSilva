import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const config = {
  apiKey: 'AIzaSyBTm3RgiULEFRRoogKJsVB7s3bwt5CQqEU',
  authDomain: 'bdd-lauraroblessilva.firebaseapp.com',
  projectId: 'bdd-lauraroblessilva',
  storageBucket: 'bdd-lauraroblessilva.firebasestorage.app',
  messagingSenderId: '265413860369',
  appId: '1:265413860369:web:7a783b3afa451ad2d365b0',
};

const app = initializeApp(config);
const auth = getAuth(app);

try {
  const res = await signInWithEmailAndPassword(auth, 'admin1@laurarobles.cl', 'Admin1234');
  console.log('SIGNED IN', res.user.uid);
} catch (err) {
  console.error('ERROR', err);
}
