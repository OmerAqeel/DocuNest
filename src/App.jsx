import './App.css';
import { SignUp } from './Pages/SignUp';
import { Navbar } from './Components/Navbar';
import { SignIn } from './Pages/SignIn';
import { Dashboard } from './Pages/Dashboard';
import { Chat } from './Pages/Chat';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Workspace } from './Pages/Workspace';
import ProtectedRoute from "./ProtectedRoute";


function App() {

  // const workSpaceName = sessionStorage.setItem("workspaceName", "");
  // const userOnWorkspaceAssistant = sessionStorage.setItem("userOnWorkspaceAssistant", false);

  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/chat/:assistantId/:conversationID" // Dynamic route
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:userName/:workspaceName" // Dynamic route
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
