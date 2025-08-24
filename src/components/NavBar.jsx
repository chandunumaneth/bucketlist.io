import { Link, useNavigate } from "react-router-dom";
import '../css/NavBar.css'; 

function NavBar () {
    const navigate = useNavigate();

    const handleLogoClick = () => {
        navigate('/');
        // Dispatch a custom event to reset search state
        window.dispatchEvent(new CustomEvent('resetToPopular'));
    };

    const handleAllMoviesClick = () => {
        navigate('/');
        // Dispatch a custom event to reset search state
        window.dispatchEvent(new CustomEvent('resetToPopular'));
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <div className="navbar-logo" onClick={handleLogoClick}>
                    <img src="/assets/images/businessLogo.png" alt="business-logo" className="navbar-logo" />
                </div>
            </div>
            <div className="navbar-links">
                <Link to="/" onClick={handleAllMoviesClick} className="nav-link">Popular Movies</Link>
                <Link to="/favourites" className="nav-link">BucketList</Link>
            </div>
        </nav>
    );
}

export default NavBar