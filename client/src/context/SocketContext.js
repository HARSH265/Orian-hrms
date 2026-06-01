import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      // Connect to the server with the auth token
      const newSocket = io('http://localhost:5004', { // Your backend server URL
        auth: {
          token: token,
        },
      });

      setSocket(newSocket);

      // Clean up the connection when the component unmounts or token changes
      return () => newSocket.close();
    } else {
      // If there's no token, disconnect any existing socket
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [token]);

  // Use useMemo to prevent the context value from changing on every render
  const contextValue = useMemo(() => ({ socket }), [socket]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};