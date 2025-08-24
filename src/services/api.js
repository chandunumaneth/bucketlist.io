const BACKEND_URL = 'http://localhost:5000/api';

// Get popular movies from backend
export const getPopularMovies = async () => {
    try {
        const response = await fetch(`${BACKEND_URL}/movies/popular`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.results || data; // Handle both response formats
    } catch (error) {
        console.error('Error fetching popular movies:', error);
        throw error;
    }
};

// Search movies via backend
export const searchMovies = async (query) => {
    try {
        const response = await fetch(`${BACKEND_URL}/movies/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.results || data; // Handle both response formats
    } catch (error) {
        console.error('Error searching movies:', error);
        throw error;
    }
};

// Get movie details via backend
export const getMovieDetails = async (movieId) => {
    try {
        const response = await fetch(`${BACKEND_URL}/movies/details/${movieId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching movie details:', error);
        throw error;
    }
};

// Get external ratings via backend
export const getExternalRatings = async (imdbId, movieTitle, releaseYear) => {
    try {
        // For OMDB search, we can pass additional parameters
        let url = `${BACKEND_URL}/movies/ratings/${imdbId || 'undefined'}`;
        if (movieTitle && releaseYear) {
            url += `?title=${encodeURIComponent(movieTitle)}&year=${releaseYear.split('-')[0]}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching external ratings:', error);
        return null; // Return null instead of throwing to prevent breaking the UI
    }
};

// Get trailer URL for a movie
export const getMovieTrailer = (videos) => {
    // Handle the TMDB API format where videos is an object with results array
    const videoList = videos?.results || videos;
    
    if (!videoList || !Array.isArray(videoList) || videoList.length === 0) return null;

    const trailer = videoList.find(video =>
        video.type === 'Trailer' &&
        video.site === 'YouTube' &&
        video.official === true
    ) || videoList.find(video =>
        video.type === 'Trailer' &&
        video.site === 'YouTube'
    );

    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
};

// AI-driven semantic movie search - Enhanced with multiple relevant matches
export const semanticMovieSearch = async (plotDescription) => {
    try {
        const response = await fetch(`${BACKEND_URL}/movies/ai-search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plotDescription })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error in AI search:', error);
        throw error;
    }
};
