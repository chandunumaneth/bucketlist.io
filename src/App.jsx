import { useState } from 'react'
import './css/App.css';
import Home from './pages/Home';
import NavBar from './components/NavBar';
import MovieCard from './components/MovieCard';
import { Routes, Route } from 'react-router-dom';
import Favourites from './pages/Favourites';
import { MovieProvider } from './contexts/MovieContext';

function App() {
  return (
    <MovieProvider>
      <NavBar />
      <main className='main-content'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/favourites' element={<Favourites />} />
        </Routes>
      </main>
    </MovieProvider>
      
  );
}



export default App
