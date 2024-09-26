console.log('app.js loaded');

const routes = {
    '/': 'login',
    '/login': 'login',
    '/register': 'register',
    '/home': 'home',
    '/profile': 'profile'
};

function navigateTo(path) {
    console.log(`Navigating to: ${path}`);
    window.history.pushState({}, path, window.location.origin + path);
    updateRoute();
}

function updateRoute() {
    const path = window.location.pathname;
    console.log(`Updating route for path: ${path}`);
    const route = routes[path] || 'login';
    loadComponent(route);
}

window.addEventListener('popstate', updateRoute);

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    document.body.addEventListener('click', e => {
        if (e.target.matches('[data-link]')) {
            e.preventDefault();
            console.log('Navigation link clicked:', e.target.href);
            navigateTo(e.target.getAttribute('href'));
        }
    });

    const token = localStorage.getItem('token');
    if (token) {
        console.log('Token found, navigating to home');
        navigateTo('/home');
    } else {
        console.log('No token found, updating route');
        updateRoute();
    }
});

function loadComponent(componentName) {
    console.log(`Loading component: ${componentName}`);
    fetch(`/static/html/${componentName}.html`)
        .then(response => response.text())
        .then(html => {
            console.log(`Component HTML received for ${componentName}`);
            document.getElementById('app').innerHTML = html;
            console.log(`${componentName} component loaded`);
            if (componentName === 'login') {
                document.getElementById('loginForm').addEventListener('submit', handleLogin);
            } else if (componentName === 'register') {
                console.log('Register component loaded, attaching event listener');
                document.getElementById('registerForm').addEventListener('submit', handleRegister);
            } else if (componentName === 'home') {
                updateNavbar();
                fetchUserData();
            } else if (componentName === 'profile') {
                updateNavbar();
                fetchUserProfile();
            }
        })
        .catch(error => {
            console.error(`Error loading ${componentName} component:`, error);
        });
}

function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/api/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', username);
            showMessage('Login successful!', 'success');
            navigateTo('/home');
        } else {
            showMessage('Login failed. Please check your credentials.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('An error occurred. Please try again.', 'error');
    });
}

function handleRegister(e) {
    e.preventDefault();
    console.log('Register form submitted');
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    console.log('Form data:', { username, email, password, confirmPassword });

    if (password !== confirmPassword) {
        showMessage('Passwords do not match!', 'error');
        return;
    }

    fetch('/api/register/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, password2: confirmPassword }),
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(({ status, body }) => {
        console.log('Register response:', { status, body });
        if (status === 201 && body.token) {
            localStorage.setItem('token', body.token);
            localStorage.setItem('username', username);
            showMessage('Registration successful!', 'success');
            navigateTo('/home');
        } else {
            const errorMessage = typeof body === 'object' 
                ? Object.entries(body).map(([key, value]) => `${key}: ${value}`).join('; ')
                : 'Registration failed. Please try again.';
            showMessage(errorMessage, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('An error occurred. Please try again.', 'error');
    });
}

function fetchUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        navigateTo('/login');
        return;
    }

    fetch('/api/profile/', {
        headers: {
            'Authorization': `Token ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('profileUsername').textContent = data.username;
        document.getElementById('profileEmail').textContent = data.email;
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Failed to load profile. Please login again.', 'error');
        handleLogout();
    });
}

function fetchUserData() {
    const username = localStorage.getItem('username');
    document.getElementById('greeting').textContent = `Hello, ${username}!`;
}

function handleLogout() {
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/api/logout/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                showMessage('Logout successful!', 'success');
                navigateTo('/login');
            } else {
                throw new Error('Logout failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('An error occurred during logout. Please try again.', 'error');
        });
    } else {
        navigateTo('/login');
    }
}

function updateNavbar() {
    const navbar = document.querySelector('nav');
    navbar.innerHTML = `
        <a href="/home" data-link>Home</a>
        <a href="/profile" data-link>Profile</a>
        <button onclick="handleLogout()">Logout</button>
    `;
}

function showMessage(message, type) {
    console.log(`Showing message: ${message} (${type})`);
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    document.getElementById('app').prepend(messageElement);

    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}