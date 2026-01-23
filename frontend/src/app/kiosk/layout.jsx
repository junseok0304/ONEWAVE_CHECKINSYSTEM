import './kiosk-globals.css';

export default function KioskLayout({ children }) {
    return (
        <div className="kioskRoot">
            {children}
        </div>
    );
}
