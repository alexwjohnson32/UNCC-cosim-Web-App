import './UserProfile.css';
import defaultIcon from '../../assets/energy.svg'

export default function UserProfile({ user, icon = defaultIcon }) {

    return (
        <div className="user-profile-container">
            <span className="user-profile-name ">{user}</span>
            <img className="user-profile-icon" src={icon} />
        </div>
    );
}