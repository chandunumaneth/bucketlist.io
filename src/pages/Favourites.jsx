import '../css/Favourites.css'
import { useMovieContext } from '../contexts/MovieContext';
import MovieCard from '../components/MovieCard';
import { useNavigate } from 'react-router-dom';

function Favourites () {
    const { favourites } = useMovieContext();
    const navigate = useNavigate();

    if (favourites && favourites.length > 0) {
        return (
            <div className="bucket-list-movies">
                <h2>Your Favourites</h2>
                <div className="movies-grid">
                    {
                        favourites.map((movie) => (
                            <MovieCard movie={movie} key={movie.id} />
                        ))
                    }
                </div>
            </div>
            
        )
    }
    else {
        return (
            <div className="bucket-list-movies-empty">
                <h3>No movies added! :(</h3>
                <button onClick={() => navigate('/')}>Create a BucketList!</button>
            </div>
        );
        
    }
    
}

export default Favourites