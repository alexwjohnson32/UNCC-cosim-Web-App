import UserProfile from '../common/UserProfile';
import "./Page.css";

export default function Page({ metadata }) {
    return (
        <div className="page">
            <div className="page-header">
                <span className="page-header-title">{metadata}</span>
                <UserProfile user={"PowerUser26"}/>
            </div>
        </div>
    );
}