import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import GuessSongGame from './pages/GuessSongGame';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router basename="/SoundMates">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/guess-song"
          element={
            <ProtectedRoute>
              <GuessSongGame />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
