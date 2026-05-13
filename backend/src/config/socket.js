const socketIo = require('socket.io');

let io;

module.exports = {
  init: (server) => {
    io = socketIo(server, {
      cors: {
        origin: "*", // Adjust this in production for security
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
      }
    });

    io.on('connection', (socket) => {
      console.log('🔗 Client connected to Socket.io:', socket.id);

      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io is not initialized!');
    }
    return io;
  }
};
