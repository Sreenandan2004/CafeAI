import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const USERS = [
  { id: 1, username: 'admin',   password: 'admin123',   role: 'admin',   name: 'Manager' },
  { id: 2, username: 'kitchen', password: 'kitchen123', role: 'kitchen', name: 'Kitchen Staff' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (username, password) => {
    const found = USERS.find(
      u => u.username === username && u.password === password
    );
    if (found) { setUser(found); return { success: true, role: found.role }; }
    return { success: false };
  };

  // Guest login — no password needed
  const loginAsGuest = () => {
    setUser({ id: 99, username: 'guest', role: 'customer', name: 'Student' });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}