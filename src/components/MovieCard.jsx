import "../css/MovieCard.css";
import { useMovieContext } from "../contexts/MovieContext";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMovieDetails, getMovieTrailer, getExternalRatings } from "../services/api";

function MovieCard({ movie }) {
    const { isFavourite, addToFavourites, removeFromFavourites } =
        useMovieContext();
    const favourite = isFavourite(movie.id);
    const [movieDetails, setMovieDetails] = useState(null);
    const [trailerUrl, setTrailerUrl] = useState(null);
    const [externalRatings, setExternalRatings] = useState(null);
    const [ratingsLoading, setRatingsLoading] = useState(false);

    const location = useLocation();
    const isFavouritesPage = location.pathname === "/favourites";

    // Fetch additional movie details and ratings
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const details = await getMovieDetails(movie.id);
                if (details) {
                    setMovieDetails(details);
                    const trailer = getMovieTrailer(details.videos);
                    setTrailerUrl(trailer);
                    
                    // Fetch real external ratings
                    setRatingsLoading(true);
                    
                    // Use external_ids.imdb_id if available, otherwise use details.imdb_id
                    const imdbId = details.external_ids?.imdb_id || details.imdb_id;
                    
                    if (imdbId || (movie.title && movie.release_date)) {
                        const ratings = await getExternalRatings(
                            imdbId, 
                            movie.title, 
                            movie.release_date
                        );
                        setExternalRatings(ratings);
                    } else {
                        console.log('No IMDb ID or sufficient info for external ratings');
                        setExternalRatings(null);
                    }
                    setRatingsLoading(false);
                }
            } catch (error) {
                console.error('Error fetching movie details:', error);
                setRatingsLoading(false);
            }
        };
        
        fetchDetails();
    }, [movie.id, movie.title, movie.release_date]);

    function FavouriteMovie(e) {
        e.preventDefault();
        if (favourite) removeFromFavourites(movie.id);
        else addToFavourites(movie);
    }

    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "https://via.placeholder.com/500x750?text=No+Image";

    const releaseYear = movie.release_date
        ? movie.release_date.split("-")[0]
        : "Unknown";

    return (
        <div className="movie-card">
            <div className="movie-poster">
                <img src={posterUrl} alt={movie.title || "Movie poster"} />
                <div
                    className={`movie-overlay ${favourite ? "permanent-overlay" : ""}`}
                >
                    {favourite && !isFavouritesPage && (
                        <div className="added-to-bucket-text">
                            <p>In the Bucket</p>
                        </div>
                    )}
                    <button
                        className={`favourite-movie ${favourite ? "active" : ""}`}
                        onClick={FavouriteMovie}
                    >
                        {favourite ? "Remove from Bucket" : "Add to Bucket"}
                    </button>
                    
                    {/* Trailer Button */}
                    {trailerUrl && (
                        <button
                            className="trailer-btn"
                            onClick={() => window.open(trailerUrl, '_blank')}
                        >
                            Watch Trailer
                        </button>
                    )}
                </div>
            </div>
            <div className="movie-info">
                <h3>{movie.title}</h3>
                <p>{releaseYear}</p>
                
                <div className="movie-ratings-section">
                    {/* Main TMDB Rating */}
                    {movie.vote_average > 0 && (
                        <span className="rating-badge tmdb-rating">
                            {movie.vote_average.toFixed(1)}
                        </span>
                    )}
                    
                    {/* Real External Ratings */}
                    <div className="external-ratings">
                        {ratingsLoading ? (
                            <div className="ratings-loading">Loading ratings...</div>
                        ) : externalRatings && (externalRatings.imdb || externalRatings.rottenTomatoes || externalRatings.metacritic) ? (
                            <>
                                {externalRatings.imdb && (
                                    <div className="rating-item">
                                        <span className="rating-source">IMDb</span>
                                        <span className="rating-value">{externalRatings.imdb}</span>
                                    </div>
                                )}
                                {externalRatings.rottenTomatoes && (
                                    <div className="rating-item">
                                        <span className="rating-source">🍅</span>
                                        <span className="rating-value">{externalRatings.rottenTomatoes}</span>
                                    </div>
                                )}
                                {externalRatings.metacritic && (
                                    <div className="rating-item">
                                        <span className="rating-source">MC</span>
                                        <span className="rating-value">{externalRatings.metacritic}</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="no-ratings">N/A</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MovieCard;
