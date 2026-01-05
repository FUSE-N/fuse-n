const supabaseUrl = (window.SUPABASE_URL && window.SUPABASE_URL !== 'None' && !window.SUPABASE_URL.includes('{{')) ? window.SUPABASE_URL : "https://sefuxvdhfgylmlqdrhoh.supabase.co";
const supabaseAnonKey = (window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY !== 'None' && !window.SUPABASE_ANON_KEY.includes('{{')) ? window.SUPABASE_ANON_KEY : "sb_publishable_5KdCsyhbO5dGmopJfa0Ycg_GA2R50v9";

let _supabaseInstance;

try {
    // The supabase library is already loaded via CDN
    // Use the global supabase object from the CDN
    if (typeof supabase === 'undefined') {
        throw new Error('Supabase library not loaded. Check if CDN script is loaded.');
    }

    _supabaseInstance = supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully.');
} catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
    alert('Failed to initialize authentication service: ' + err.message);
}

async function signInWithGoogle() {
    try {
        const { data, error } = await _supabaseInstance.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/templates/oauth_consent.html'
            }
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error signing in with Google:', error.message);
        throw error;
    }
}

async function signUpWithGoogle() {
    // For OAuth, sign up and sign in are the same flow
    return signInWithGoogle();
}

async function signOut() {
    const { error } = await _supabaseInstance.auth.signOut();
    if (error) {
        console.error('Error signing out:', error.message);
        throw error;
    } else {
        window.location.href = '../index.html';
    }
}

async function signInWithEmail(email, password) {
    try {
        const { data, error } = await _supabaseInstance.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error signing in with email:', error.message);
        throw error;
    }
}

async function signUpWithEmail(email, password, fullName) {
    try {
        const { data, error } = await _supabaseInstance.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
                emailRedirectTo: window.location.origin + '/login.html'
            }
        });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error signing up:', error.message);
        throw error;
    }
}

async function resetPassword(email) {
    try {
        const { data, error } = await _supabaseInstance.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/login.html',
        });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error resetting password:', error.message);
        throw error;
    }
}

async function checkSession() {
    try {
        const { data: { session }, error } = await _supabaseInstance.auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        console.error('Error getting session:', error.message);
        return null;
    }
}

// Global exposure for specific use cases
window.supabaseClient = {
    supabase: _supabaseInstance,
    signInWithGoogle,
    signUpWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    checkSession
};

// Also expose for direct access
window.supabase = _supabaseInstance;