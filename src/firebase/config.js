// Importa las funciones que necesites de los SDKs 
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function _serverConfigFromEnv() {
    return {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? null,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? null,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? null,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? null,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? null,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? null,
    };
}

function _clientConfigFromEnv() {
    return {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? null,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? null,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? null,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? null,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? null,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? null,
    };
}

function _validateConfig(config) {
    const requiredKeys = [
        "apiKey",
        "authDomain",
        "projectId",
        "storageBucket",
        "messagingSenderId",
        "appId",
    ];
    const missing = requiredKeys.filter((key) => !config?.[key]);
    if (missing.length > 0) {
        throw new Error(`Firebase config missing required keys: ${missing.join(", ")}`);
    }
}

export async function getFirebaseApp() {
    if (getApps().length > 0) return getApps()[0];

    const config = typeof window === "undefined" ? _serverConfigFromEnv() : _clientConfigFromEnv();
    _validateConfig(config);

    const app = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
        measurementId: config.measurementId,
    });

    console.info("[firebase/config] Firebase app initialized", {
        apiKey: config.apiKey ? `${config.apiKey.slice(0, 4)}...` : null,
        authDomain: config.authDomain,
        projectId: config.projectId,
    });
    return app;
}

export async function getFirebaseAuth() {
    const app = await getFirebaseApp();
    return getAuth(app);
}

export async function getFirebaseFirestore() {
    const app = await getFirebaseApp();
    return getFirestore(app);
}

export default getFirebaseApp;
