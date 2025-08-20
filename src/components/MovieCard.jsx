function MovieCard({movie}) {

    function FavouriteMovie() {
        alert("Clicked Favourite");
    }

    return (
        <div className="movie-card">
            <div className="movie-poster">
                <img src={movie.url} alt={movie.title}/>
                <div className="movie-overlay">
                    <button className="favourite-movie" onClick={FavouriteMovie}>
                        Add to Favourites
                    </button>
                </div>
            </div>
            <div className="movie-info">
                <h3>{movie.title}</h3>
                <p>{movie.release_date}</p>
            </div>
        </div>
    );
}

export default MovieCard