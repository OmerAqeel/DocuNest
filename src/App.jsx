import logo from './logo.svg';
import './App.css';
import { useState } from 'react';
import { SignUp } from './Pages/SignUp';
import { Navbar } from './Components/Navbar';
import { SignIn } from './Pages/SignIn';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/signin" element={<SignIn />} />
      </Routes>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </div>
    </Router>
  );
}

export default App;
