const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'techseed_chat_app',
    password: 'edmond9755',
    port: 5432,
});

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

const users = [];

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('sendMessage', (msg) => {
        const newMessage = { content: msg.content, isCurrentUser: socket.id === msg.socketId };
        io.emit('message', newMessage);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});


app.post('/api/signup', async (req, res) => {
    const {firstName, lastName, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const JWT_SECRET = 'f8e6e92b3d9f957f36c9aef688f4476d0294848a6c9f3fcb66d40b8f2584acb2';
    
    try {
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'L\'addresse email exist déjà' });
        }
        
        const newUser = await pool.query(
            'INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
            [firstName, lastName, email, hashedPassword]
        );
        const token = jwt.sign({ id: newUser.rows[0].id }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const JWT_SECRET = 'f8e6e92b3d9f957f36c9aef688f4476d0294848a6c9f3fcb66d40b8f2584acb2';
    
    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Email ou mot de passe non valide' });
        }
        
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Email ou mot de passe non valide' });
        }
        
        const token = jwt.sign({ id: user.rows[0].id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));