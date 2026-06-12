import React, { useState, useEffect } from "react";
import "./App.css";
import Board from "./components/Board";
import AddNoteForm from "./components/AddNoteForm";

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Anonim Duvar</h1>
        <p>Dolup taşsın buralar</p>
      </header>

      <Board />
      <AddNoteForm />
    </div>
  );
}

export default App;
