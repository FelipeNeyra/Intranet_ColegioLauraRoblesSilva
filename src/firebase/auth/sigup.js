import { getFirebaseAuth } from "../config";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default async function signUp(email, password) {
    try {
        const auth = await getFirebaseAuth();
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return { result, error: null };
    } catch (error) {
        return { result: null, error };
    }
}
