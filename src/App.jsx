import { useState } from 'react'
import './App.css'
import MovieCard from './components/MovieCard';

function App() {
  return (
    <>
      <MovieCard movie={{title: "Sri Lanka Police", release_date: "2024-01-01"}}/>
    </>
  );
}



export default App
