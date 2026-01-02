// Supabase Initialization
const supabaseUrl = window.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = window.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// For local testing, we might want to get these from somewhere else or hardcode if the user permits
// But best practice is to have them injected or handled securely.
// Since this is a client-side script, they will be exposed anyway.

console.log('supabase_init.js loading...');

let _supabaseInstance;

try {
    const supabaseLib = window.supabase || window.supabasejs;
    if (!supabaseLib) {
        throw new Error('Supabase library not found on window. Check if CDN script is loaded.');
    }

    _supabaseInstance = supabaseLib.createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully.');
} catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
}

async function signInWithGoogle() {
    const { data, error } = await _supabaseInstance.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/dashboard'
        }
    });

    if (error) {
        console.error('Error signing in:', error.message);
        alert('Authentication failed: ' + error.message);
    }
}

async function signOut() {
    const { error } = await _supabaseInstance.auth.signOut();
    if (error) {
        console.error('Error signing out:', error.message);
    } else {
        window.location.href = '/';
    }
}

async function signInWithEmail(email, password) {
    const { data, error } = await _supabaseInstance.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

async function signUpWithEmail(email, password, fullName) {
    const { data, error } = await _supabaseInstance.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
            emailRedirectTo: window.location.origin + '/login'
        }
    });
    if (error) throw error;
    return data;
}

async function resetPassword(email) {
    const { data, error } = await _supabaseInstance.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login', // User will be redirected here after clicking reset link
    });
    if (error) throw error;
    return data;
}

async function checkSession() {
    const { data: { session }, error } = await _supabaseInstance.auth.getSession();
    if (error) {
        console.error('Error getting session:', error.message);
        return null;
    }
    return session;
}

// Global exposure for specific use cases
window.supabaseClient = {
    supabase: _supabaseInstance,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    checkSession
};
