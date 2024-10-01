const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your_secret_key';

app.use(bodyParser.json());

// In-memory storage for users and teams (for simplicity)
let users = [];
let teams = [];

// Load users and teams from files if they exist
async function loadData() {
    try {
        const usersData = await fs.readFile('users.json', 'utf8');
        users = JSON.parse(usersData);
    } catch (err) {
        console.log('No users data found, starting with an empty list.');
    }

    try {
        const teamsData = await fs.readFile('teams.json', 'utf8');
        teams = JSON.parse(teamsData);
    } catch (err) {
        console.log('No teams data found, starting with an empty list.');
    }
}

// Save users and teams to files
async function saveData() {
    await fs.writeFile('users.json', JSON.stringify(users, null, 2));
    await fs.writeFile('teams.json', JSON.stringify(teams, null, 2));
}

// Middleware to authenticate JWT tokens
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// User registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    await saveData();
    res.status(201).send('User registered');
});

// User login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(403).send('Invalid username or password');
    }
    const token = jwt.sign({ username: user.username }, SECRET_KEY);
    res.json({ token });
});

// Get teams
app.get('/teams', authenticateToken, (req, res) => {
    res.json(teams);
});

// Create a new team
app.post('/teams', authenticateToken, async (req, res) => {
    const { teamName, players } = req.body;
    teams.push({ teamName, players });
    await saveData();
    res.status(201).send('Team created');
});

// Start the server
app.listen(PORT, async () => {
    await loadData();
    console.log(`Server is running on http://localhost:${PORT}`);
});