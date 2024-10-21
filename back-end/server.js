const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
}));
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'techseed_chat_app',
    password: 'edmond9755',
    port: 5432,
});

const JWT_SECRET = 'f8e6e92b3d9f957f36c9aef688f4476d0294848a6c9f3fcb66d40b8f2584acb2';

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    }
});

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Token invalide' });
        req.user = decoded;
        next();
    });
};

const authenticateSocket = (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error'));
        }
        socket.userId = decoded.id;
        next();
    });
};

const users = {};

io.use(authenticateSocket);

io.on('connection', async (socket) => {
    console.log('A user connected:', socket.userId);

    try {
        
        const result = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [socket.userId]);

        if (result.rows.length > 0) {
            const { first_name, last_name } = result.rows[0];
            users[socket.userId] = { socketId: socket.id, firstName: first_name, lastName: last_name };

            const connectedUsers = Object.keys(users).map((userId) => ({
                userId,
                firstName: users[userId].firstName,
                lastName: users[userId].lastName
            }));

            io.emit('userList', connectedUsers);
        }

        const messages = await pool.query(
            'SELECT m.content, m.timestamp, m.first_name, m.last_name, m.user_id FROM messages m ORDER BY m.timestamp ASC'
        );

        socket.emit('previousMessages', messages.rows);

    } catch (err) {
        console.error('Error fetching user:', err);
    }

    socket.on('sendMessage', async (msg) => {
        try {
            const result = await pool.query(
                'INSERT INTO messages (user_id, first_name, last_name, content) VALUES ($1, $2, $3, $4) RETURNING timestamp',
                [socket.userId, msg.first_name, msg.last_name, msg.content]
            );
    
            const timestamp = result.rows[0].timestamp;
    
            const newMessage = {
                content: msg.content,
                user_id: socket.userId,
                first_name: msg.first_name,
                last_name: msg.last_name,
                timestamp: timestamp,
            };
    
            socket.broadcast.emit('message', newMessage);
    
            socket.emit('message', newMessage);
    
        } catch (err) {
            console.error('Error sending message:', err);
        }
    });    

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.userId);
        delete users[socket.userId];

        const connectedUsers = Object.keys(users).map((userId) => ({
            userId,
            firstName: users[userId]?.firstName,
            lastName: users[userId]?.lastName
        }));

        io.emit('userList', connectedUsers);
    });
});


app.post('/api/signup', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'L\'adresse email existe déjà' });
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


app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            'SELECT id, first_name, last_name FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const user = result.rows[0];
        res.json(user);
        
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur :', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
