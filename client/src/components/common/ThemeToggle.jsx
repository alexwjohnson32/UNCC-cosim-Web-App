import { useState } from "react";
import lightModeIcon from '../../assets/light_mode.svg';
import darkModeIcon from '../../assets/dark_mode.svg';
import './ThemeToggle.css';

export default function ThemeToggle(props) {
    const [lightMode, setLightMode] = useState(true);

    return (
        <button onClick={() => setLightMode(!lightMode)}>
            {lightMode ?
                <img src={lightModeIcon}></img> :
                <img src={darkModeIcon}></img>
            }
        </button>
    );
}