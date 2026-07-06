import { getFirebaseAuth } from "../config";
import { signInWithEmailAndPassword } from "firebase/auth";

export default async function signIn(email, password) {
    try {
        const auth = await getFirebaseAuth();
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { result, error: null };
    } catch (error) {
        return { result: null, error };
    }
}
