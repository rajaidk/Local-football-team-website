import { auth, loginWithGoogle, logoutUser } from './firebase-service.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';

function initAuthUI() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    // Check if auth container already exists
    let authContainer = document.getElementById('auth-status-container');
    if (!authContainer) {
        authContainer = document.createElement('span');
        authContainer.id = 'auth-status-container';
        authContainer.className = 'nav-auth-container';
        authContainer.innerHTML = `
            <span class="auth-divider">|</span>
            <button id="googleSignInBtn" class="auth-btn signin-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" style="margin-right: 6px; vertical-align: middle;">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Sign In with Google
            </button>
            <div id="userProfileBadge" class="user-badge" style="display: none;">
                <img id="userAvatar" src="" alt="Avatar" class="user-avatar" style="display: none;">
                <span id="userName" class="user-name"></span>
                <button id="googleSignOutBtn" class="auth-btn signout-btn" title="Sign Out">Sign Out</button>
            </div>
        `;

        nav.appendChild(authContainer);
    }

    const signInBtn = document.getElementById('googleSignInBtn');
    const signOutBtn = document.getElementById('googleSignOutBtn');
    const userBadge = document.getElementById('userProfileBadge');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');

    if (signInBtn) {
        signInBtn.onclick = async (e) => {
            e.preventDefault();
            try {
                signInBtn.disabled = true;
                signInBtn.textContent = 'Connecting...';
                await loginWithGoogle();
            } catch (err) {
                // If it's not a user-cancelled popup, log and display message
                if (err?.code !== 'auth/popup-closed-by-user' && !err?.message?.includes('popup-closed-by-user')) {
                    console.error('Sign-in error:', err);
                    alert('Sign-in encountered an error. Please try again.');
                }
            } finally {
                signInBtn.disabled = false;
                signInBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" style="margin-right: 6px; vertical-align: middle;">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Sign In with Google
                `;
            }
        };
    }

    if (signOutBtn) {
        signOutBtn.onclick = async (e) => {
            e.preventDefault();
            try {
                await logoutUser();
            } catch (err) {
                console.error(err);
            }
        };
    }

    // Listen to Auth State Changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (signInBtn) signInBtn.style.display = 'none';
            if (userBadge) userBadge.style.display = 'inline-flex';
            if (userName) userName.textContent = user.displayName || user.email.split('@')[0];
            if (userAvatar) {
                if (user.photoURL) {
                    userAvatar.src = user.photoURL;
                    userAvatar.style.display = 'inline-block';
                } else {
                    userAvatar.style.display = 'none';
                }
            }
            // Dispatch custom event for page listeners
            window.dispatchEvent(new CustomEvent('clubUserAuthChanged', { detail: { user } }));
        } else {
            if (signInBtn) signInBtn.style.display = 'inline-flex';
            if (userBadge) userBadge.style.display = 'none';
            window.dispatchEvent(new CustomEvent('clubUserAuthChanged', { detail: { user: null } }));
        }
    });
}

// Auto mount on document load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthUI);
} else {
    initAuthUI();
}
