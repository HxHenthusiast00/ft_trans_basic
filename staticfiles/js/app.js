// app.js

document.addEventListener('DOMContentLoaded', () => {
    loadComponent('login');
});

function loadComponent(componentName) {
    fetch(`/static/html/${componentName}.html`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('app').innerHTML = html;
            if (componentName === 'login') {
                document.getElementById('loginForm').addEventListener('submit', handleLogin);
            } else if (componentName === 'register') {
                document.getElementById('registerForm').addEventListener('submit', handleRegister);
            } else if (componentName === 'profile') {
                fetchUserProfile();
                document.getElementById('logoutButton').addEventListener('click', handleLogout);
            }
        });
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/api/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(({ status, body }) => {
        if (status === 200 && body.token) {
            localStorage.setItem('token', body.token);
            showMessage('Login successful!', 'success');
            loadComponent('profile');
        } else {
            showMessage(body.error || 'Login failed. Please check your credentials.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('An error occurred. Please try again.', 'error');
    });
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

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
        if (status === 201 && body.token) {
            localStorage.setItem('token', body.token);
            showMessage('Registration successful!', 'success');
            loadComponent('profile');
        } else {
            const errorMessage = Object.entries(body)
                .map(([key, value]) => `${key}: ${value.join(', ')}`)
                .join('; ');
            showMessage(`Registration failed. ${errorMessage}`, 'error');
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
        loadComponent('login');
        return;
    }

    fetch('/api/profile/', {
        headers: {
            'Authorization': `Token ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('profileUsername').textContent = data.username;
        document.getElementById('profileEmail').textContent = data.email;
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Failed to load profile. Please login again.', 'error');
        localStorage.removeItem('token');
        loadComponent('login');
    });
}

function handleLogout() {
    const token = localStorage.getItem('token');
    if (!token) {
        loadComponent('login');
        return;
    }

    fetch('/api/logout/', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`
        }
    })
    .then(response => {
        if (response.ok) {
            localStorage.removeItem('token');
            showMessage('Logout successful!', 'success');
            loadComponent('login');
        } else {
            throw new Error('Logout failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('An error occurred during logout. Please try again.', 'error');
    });
}

function showMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    document.getElementById('app').prepend(messageElement);

    // Remove the message after 3 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

// Add event listeners for navigation
document.addEventListener('click', (e) => {
    if (e.target.id === 'navLogin') {
        e.preventDefault();
        loadComponent('login');
    } else if (e.target.id === 'navRegister') {
        e.preventDefault();
        loadComponent('register');
    } else if (e.target.id === 'navProfile') {
        e.preventDefault();
        loadComponent('profile');
    }
});