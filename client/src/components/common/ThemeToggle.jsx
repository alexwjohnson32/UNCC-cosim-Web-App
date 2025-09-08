import { useState } from "react";
import lightModeIcon from '../../assets/light_mode.svg';
import darkModeIcon from '../../assets/dark_mode.svg';

export default function ThemeToggle() {
    const [lightMode, setLightMode] = useState(true);

    return (
        <button
            className='flex cursor-pointer bg-white/5 hover:bg-white/15 h-10 w-10 rounded-full justify-center'
            onClick={() => setLightMode(!lightMode)}
        >
            {lightMode ?
                <img src={lightModeIcon}></img> :
                <img src={darkModeIcon}></img>
            }
        </button>
    );
}