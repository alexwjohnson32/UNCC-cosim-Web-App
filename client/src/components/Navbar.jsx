import logo from '../assets/v_logo.svg';
import pjson from '../../../package.json';
import ThemeToggle from "./common/ThemeToggle";

export default function Navbar({ pageList, currentPage, onPageChange }) {
    function createPageButton(page) {
        return (
            <div
                key={`navbar-btn-${page}`}
                onClick={() => onPageChange(page)}
                className={[
                    "flex w-full h-9 px-2 items-center gap-2.5 rounded-lg font-semibold cursor-pointer",
                    currentPage === page
                        ? "text-white bg-white/10"
                        : "text-white/75 hover:text-white hover:bg-white/5"
                ].join(" ")}
            >
                {page}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 bg-corvid-blue w-50 min-w-50 h-full px-4 py-8">
            <div className="flex items-baseline justify-center text-white text-2xl font-bold">
                <img className='h-12' src={logo} />
                <span className="-ml-4">GridSim</span>
            </div>
            <div className="flex flex-col h-full w-full">
                {pageList.map(page => createPageButton(page))}
            </div>
            <div className="flex flex-col items-center justify-end gap-4 w-full">
                <ThemeToggle />
                <span className="text-[#d9d9d9] italic">v {pjson.version}</span>
            </div>
        </div>
    )
}