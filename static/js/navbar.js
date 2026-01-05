document.addEventListener('DOMContentLoaded', () => {
    const getStartedBtn = document.getElementById('getStartedBtn');
    const profileContainer = document.getElementById('profileContainer');
    const headerUserName = document.getElementById('headerUserName');
    const headerAvatar = document.getElementById('headerAvatar');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');

    async function updateHeader() {
        if (typeof window.supabaseClient === 'undefined' || typeof window.supabaseClient.checkSession !== 'function') {
            // Wait a bit if not ready
            setTimeout(updateHeader, 500);
            return;
        }

        try {
            const session = await window.supabaseClient.checkSession();
            if (session) {
                if (getStartedBtn) getStartedBtn.style.display = 'none';
                if (profileContainer) profileContainer.style.display = 'flex';

                const user = session.user;
                if (headerUserName) headerUserName.textContent = user.user_metadata.full_name || user.email;
                if (headerAvatar && user.user_metadata.avatar_url) {
                    headerAvatar.src = user.user_metadata.avatar_url;
                }
            } else {
                if (getStartedBtn) getStartedBtn.style.display = 'inline-block';
                if (profileContainer) profileContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('Error updating header:', error);
        }
    }

    if (profileContainer) {
        profileContainer.addEventListener('click', function (e) {
            e.stopPropagation();
            this.classList.toggle('active');
        });
    }

    document.addEventListener('click', function (e) {
        if (profileContainer && !profileContainer.contains(e.target)) {
            profileContainer.classList.remove('active');
        }
    });

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function () {
            navLinks.classList.toggle('active');
        });
    }

    updateHeader();
});
