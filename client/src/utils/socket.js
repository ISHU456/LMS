import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5001';

const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 5000
});

export default socket;
