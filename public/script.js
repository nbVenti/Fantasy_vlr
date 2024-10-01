document.addEventListener('DOMContentLoaded', () => {
    const toggleFeaturesBtn = document.getElementById('toggleFeaturesBtn');
    const featuresList = document.getElementById('featuresList');
    const updatesContainer = document.getElementById('updatesContainer');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const authFormContainer = document.getElementById('authFormContainer');
    const addPlayerBtn = document.getElementById('addPlayerBtn');
    const createTeamBtn = document.getElementById('createTeamBtn');
    const teamListContainer = document.getElementById('teamListContainer');
    const teamNameInput = document.getElementById('teamName');
    const playerNameInput = document.getElementById('playerName');

    let currentTeam = [];
    let token = '';

    // Toggle the visibility of the features list
    toggleFeaturesBtn.addEventListener('click', () => {
        if (featuresList.style.display === 'none') {
            featuresList.style.display = 'block';
        } else {
            featuresList.style.display = 'none';
        }
    });

    // Simulate real-time updates
    const updates = [
        'Player X scored 30 points!',
        'Team Y won their match!',
        'Player Z achieved a new high score!',
        'New league standings are available!'
    ];

    let updateIndex = 0;
    setInterval(() => {
        if (updateIndex < updates.length) {
            const update = document.createElement('p');
            update.textContent = updates[updateIndex];
            updatesContainer.appendChild(update);
            updateIndex++;
        }
    }, 3000); // Update every 3 seconds

    // Handle user authentication
    loginBtn.addEventListener('click', () => {
        showAuthForm('login');
    });

    signupBtn.addEventListener('click', () => {
        showAuthForm('signup');
    });

    function showAuthForm(type) {
        authFormContainer.innerHTML = `
            <h3>${type === 'login' ? 'Login' : 'Sign Up'}</h3>
            <input type="text" id="username" placeholder="Username">
            <input type="password" id="password" placeholder="Password">
            <button id="${type}SubmitBtn">${type === 'login' ? 'Login' : 'Sign Up'}</button>
        `;
        document.getElementById(`${type}SubmitBtn`).addEventListener('click', async () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            if (type === 'login') {
                await loginUser(username, password);
            } else {
                await signupUser(username, password);
            }
        });
    }

    async function signupUser(username, password) {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (response.ok) {
            alert(`Signed up as ${username}`);
            authFormContainer.innerHTML = '';
        } else {
            alert('Sign up failed');
        }
    }

    async function loginUser(username, password) {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (response.ok) {
            const data = await response.json();
            token = data.token;
            alert(`Logged in as ${username}`);
            authFormContainer.innerHTML = '';
        } else {
            alert('Login failed');
        }
    }

    // Handle team building
    addPlayerBtn.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (playerName) {
            currentTeam.push(playerName);
            playerNameInput.value = '';
            updateTeamList();
        }
    });

    createTeamBtn.addEventListener('click', async () => {
        const teamName = teamNameInput.value.trim();
        if (teamName && currentTeam.length > 0) {
            const response = await fetch('http://localhost:3000/teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ teamName, players: currentTeam })
            });
            if (response.ok) {
                alert(`Team "${teamName}" created with players: ${currentTeam.join(', ')}`);
                teamNameInput.value = '';
                currentTeam = [];
                updateTeamList();
            } else {
                alert('Failed to create team');
            }
        } else {
            alert('Please enter a team name and add at least one player.');
        }
    });

    function updateTeamList() {
        teamListContainer.innerHTML = `
            <h3>Current Team</h3>
            <ul>
                ${currentTeam.map(player => `<li>${player}</li>`).join('')}
            </ul>
        `;
    }
});