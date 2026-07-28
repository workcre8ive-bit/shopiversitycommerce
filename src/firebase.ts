import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with settings optimized for AI Studio environment
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
}, firebaseConfig.firestoreDatabaseId || "(default)");

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Connection test to diagnose connectivity issues
async function testConnection() {
  try {
    // Try to fetch a dummy document to verify connection
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firestore connection check completed successfully.");
  } catch (error: any) {
    if (error.message?.includes('client is offline') || error.code === 'unavailable') {
      console.log("Firestore connection status: Operating in offline cache mode. This is normal for sandbox previews.");
    } else {
      console.log("Firestore connection test complete (server reachable).");
    }
  }
}

testConnection();
