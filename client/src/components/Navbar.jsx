import "./Navbar.css";
import logo from '../assets/v_logo.svg';
import pjson from '../../../package.json';
import ThemeToggle from "./common/ThemeToggle";

export default function Navbar({ pageList, currentPage, onPageChange }) {
    function createPageButton(page) {
        return (
            <div
                key={`navbar-btn-${page}`}
                className={`navbar-btn ${currentPage === page ? "active" : ""}`}
                onClick={() => onPageChange(page)}
            >
                {page}
            </div>
        );
    }

    return (
        <div className="navbar">
            <div className="logo-container">
                <img className='logo-v' src={logo} />
                <span className="app-title">GridSim</span>
            </div>
            <div className="navbar-btn-container">
                {pageList.map(page => createPageButton(page))}
            </div>
            <div className="navbar-extras-container">
                <ThemeToggle />
                <span className="app-version-number">v {pjson.version}</span>
            </div>
        </div>
    )
}