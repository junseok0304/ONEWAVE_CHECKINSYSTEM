export default function Button({ text, onClick, style }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: "#1d2244",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "10px 16px",
                cursor: "pointer",
                ...style
            }}
        >
            {text}
        </button>
    );
}
