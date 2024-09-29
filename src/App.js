import React from 'react';
import './styles/App.css';
import ObjectDetector from './components/ObjectDetector';
function App() {
  return (
    <div className="App">
      <ObjectDetector />
      

      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        textAlign: 'center',
        padding: '10px'
      }}>
        Made by{' '}
        <a href="https://github.com/ankitsinghmyself">Ankit</a>
        &copy; {new Date().getFullYear()}

      </footer>
    </div>
  );
}

export default App;
