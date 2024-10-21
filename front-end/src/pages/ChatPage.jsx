import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import '../styles/chatpage.css';

const ChatPage = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('Token manquant');
                    return;
                }

                const response = await fetch('http://localhost:5000/api/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    console.error('Erreur lors de la récupération de l\'utilisateur');
                    return;
                }

                const data = await response.json();
                setCurrentUser(data);

                const newSocket = io('http://localhost:5000', {
                    auth: {
                        token,
                    },
                });

                setSocket(newSocket);

                newSocket.on('previousMessages', (previousMessages) => {
                    setMessages(previousMessages);
                });

                newSocket.on('message', (newMessage) => {
                    setMessages(prevMessages => {
                        
                        const messageExists = prevMessages.some(msg => 
                            msg.content === newMessage.content && msg.timestamp === newMessage.timestamp
                        );

                        if (!messageExists) {
                            return [...prevMessages, newMessage];
                        }

                        return prevMessages;
                    });
                });

                newSocket.on('userList', (connectedUsers) => {
                    setUsers(connectedUsers);
                });

                return () => {
                    newSocket.off('message');
                    newSocket.off('userList');
                    newSocket.disconnect();
                };
            } catch (error) {
                console.error('Erreur lors de la récupération de l\'utilisateur :', error);
            }
        };

        fetchUser();
    }, []);

    const sendMessage = () => {
        if (currentUser && socket) {
            const newMessage = {
                content: message,
                first_name: currentUser.first_name,
                last_name: currentUser.last_name,
                user_id: currentUser.id,
                timestamp: new Date().toISOString(),
            };

            socket.emit('sendMessage', newMessage);
            setMessage('');
        } else {
            console.error('Utilisateur ou socket non disponible');
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="chat-container">
            <div className="sidebar">
                <h3>Utilisateurs connectés</h3>
                <ul>
                    {users.map((user, index) => (
                        <li key={index} className="users">
                            {user.firstName} {user.lastName}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="chat-area">
                <div className="messages">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={
                                msg.user_id === currentUser?.id
                                    ? 'my-message-container'
                                    : 'other-message-container'
                            }
                        >
                            <div>
                                <div className="message-sender">
                                    {msg.user_id === currentUser?.id ? (
                                        <h4 className="you">Vous</h4>
                                    ) : (
                                        <h4>
                                            {msg.first_name} {msg.last_name}
                                        </h4>
                                    )}
                                </div>

                                <p
                                    className={
                                        msg.user_id === currentUser?.id
                                            ? 'my-message'
                                            : 'other-message'
                                    }
                                >
                                    {msg.content}
                                </p>

                                <div className="message-footer">
                                    <span
                                        className={
                                            msg.user_id === currentUser?.id
                                                ? 'my-message-time'
                                                : 'other-message-time'
                                        }
                                    >
                                        {formatTimestamp(msg.timestamp)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="send-message">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Écrivez un message..."
                    />
                    <button onClick={sendMessage} disabled={!message.trim()}>
                        Envoyer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
