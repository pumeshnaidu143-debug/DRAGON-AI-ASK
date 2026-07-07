import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "./App.css";

import { AuthProvider } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";
import Editor from "./pages/Editor";
import Challenges from "./pages/Challenges";
import Lessons from "./pages/Lessons";

function App() {
  return (
    <div className="App min-h-screen bg-black">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/lessons" element={<Lessons />} />
          </Routes>
        </BrowserRouter>
        <Toaster theme="dark" position="top-right" richColors closeButton />
      </AuthProvider>
    </div>
  );
}

export default App;