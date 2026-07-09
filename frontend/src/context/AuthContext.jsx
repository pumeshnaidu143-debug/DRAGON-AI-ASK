import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // BYPASS AUTH: Instantly load a fake guest user profile
  const [user] = useState({ id: "public_guest_id", name: "Guest Developer", email: "guest@dragon.ai" });
  
  return (
    <AuthContext.Provider value={{ user, ready: true, login: async ()=>{}, register: async ()=>{}, logout: ()=>{} }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
