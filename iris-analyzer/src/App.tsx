import React from 'react';
import './App.css';
import IrisAnalysis from './views/IrisAnalysis';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Iris Analyzer</h1>
      </header>
      <main>
        <IrisAnalysis />
      </main>
    </div>
  );
}

export default App;