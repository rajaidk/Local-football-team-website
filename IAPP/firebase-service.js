// Firebase Client Module
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    getDocFromServer,
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    orderBy, 
    limit, 
    onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

export const firebaseConfig = {
  projectId: "gen-lang-client-0029915235",
  appId: "1:243249447518:web:ebe0ec356c21c38afaeacf",
  apiKey: "AIzaSyAZEuj0xwAW365ESrMy-gsR01kgAcrsilI",
  authDomain: "gen-lang-client-0029915235.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-localfootballtea-7525eb8e-358f-47cf-a8a6-e208f845405e",
  storageBucket: "gen-lang-client-0029915235.firebasestorage.app",
  messagingSenderId: "243249447518",
  measurementId: "",
  oAuthClientId: "243249447518-8ma0e4trrnh6c259q6ipr5hok5761e4m.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// Initialize the Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore using the specified firestoreDatabaseId (CRITICAL)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Provider instance
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Operation Types for hardened error logging
export const OperationType = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    LIST: 'list',
    GET: 'get',
    WRITE: 'write'
};

// Error handling helper conforming to FirestoreErrorInfo spec
export function handleFirestoreError(error, operationType, path) {
    const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: {
            userId: auth.currentUser?.uid || null,
            email: auth.currentUser?.email || null,
            emailVerified: auth.currentUser?.emailVerified || null,
            isAnonymous: auth.currentUser?.isAnonymous || null,
            tenantId: auth.currentUser?.tenantId || null,
            providerInfo: auth.currentUser?.providerData?.map(provider => ({
                providerId: provider.providerId,
                email: provider.email,
            })) || []
        },
        operationType,
        path
    };
    console.error('Firestore Error:', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
}

// Test initial connection as required by specification
async function testFirestoreConnection() {
    try {
        await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
            console.warn('Please check your Firebase configuration.');
        }
    }
}
testFirestoreConnection();

// Sign In with Google popup
export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Sync user profile in Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
            await setDoc(userRef, {
                userId: user.uid,
                email: user.email || '',
                displayName: user.displayName || 'Football Fan',
                photoURL: user.photoURL || '',
                createdAt: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
        }

        return user;
    } catch (error) {
        // User deliberately closed the popup or clicked outside - this is normal user behavior, not an app failure
        if (error?.code === 'auth/popup-closed-by-user' || error?.message?.includes('popup-closed-by-user')) {
            console.log('User closed the Google Sign-In popup before completing authentication.');
            return null;
        }
        if (error?.code === 'auth/cancelled-popup-request') {
            console.log('Multiple popup requests triggered; latest one processed.');
            return null;
        }
        console.error('Google Sign-In failed:', error);
        throw error;
    }
}

// Sign Out
export async function logoutUser() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Sign-Out failed:', error);
        throw error;
    }
}

// Create or submit membership application
export async function submitApplication(data) {
    if (!auth.currentUser) {
        throw new Error('Please sign in with Google to submit your membership application.');
    }

    const payload = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email || data.email,
        fullName: data.fullName,
        dob: data.dob || '',
        gender: data.gender || '',
        email: data.email,
        phone: data.phone,
        experience: data.experience || '',
        preferredPosition: data.preferredPosition || '',
        trainingGoal: data.trainingGoal || '',
        medicalNotes: data.medicalNotes || '',
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    const targetCollection = 'applications';
    try {
        const docRef = await addDoc(collection(db, targetCollection), payload);
        return { id: docRef.id, ...payload };
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, targetCollection);
    }
}

// Fetch user's membership applications
export async function getUserApplications() {
    if (!auth.currentUser) return [];

    const targetPath = 'applications';
    try {
        const q = query(
            collection(db, targetPath),
            where('userId', '==', auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const apps = [];
        snapshot.forEach(docSnap => {
            apps.push({ id: docSnap.id, ...docSnap.data() });
        });
        return apps;
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, targetPath);
    }
}

// Submit contact enquiry
export async function submitEnquiry(data) {
    if (!auth.currentUser) {
        throw new Error('Please sign in with Google first before submitting an enquiry.');
    }

    const payload = {
        userId: auth.currentUser.uid,
        purpose: data.purpose,
        name: data.name,
        email: data.email,
        message: data.message,
        createdAt: new Date().toISOString()
    };

    const targetPath = 'enquiries';
    try {
        const docRef = await addDoc(collection(db, targetPath), payload);
        return { id: docRef.id, ...payload };
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, targetPath);
    }
}

// Save game score
export async function recordGameScore(scoreData) {
    if (!auth.currentUser) return null;

    const payload = {
        userId: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
        gameType: scoreData.gameType,
        score: scoreData.score,
        attempts: scoreData.attempts || 0,
        timeRemaining: scoreData.timeRemaining || 0,
        createdAt: new Date().toISOString()
    };

    const targetPath = 'gameScores';
    try {
        const docRef = await addDoc(collection(db, targetPath), payload);
        return { id: docRef.id, ...payload };
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, targetPath);
    }
}

// Top scores listener or getter
export async function getTopGameScores(gameType = 'memory', limitCount = 5) {
    const targetPath = 'gameScores';
    try {
        const q = query(
            collection(db, targetPath),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        const scores = [];
        snapshot.forEach(d => {
            const data = d.data();
            if (data.gameType === gameType) {
                scores.push({ id: d.id, ...data });
            }
        });
        return scores.sort((a, b) => b.score - a.score);
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, targetPath);
    }
}
