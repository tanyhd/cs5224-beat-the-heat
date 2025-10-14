export default function Chatbot({ stroke, fill, ...rest }: { stroke?: string; fill?: string;[rest: string]: any }) {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
        >
            <g
                stroke={stroke || "#000"}
                fill={fill || "none"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {/* Speech bubble */}
                <path d="M8 16C8 10.4772 12.4772 6 18 6H46C51.5228 6 56 10.4772 56 16V36C56 41.5228 51.5228 46 46 46H24L14 56V46H18C12.4772 46 8 41.5228 8 36V16Z" />

                {/* Eyes */}
                <circle cx="24" cy="26" r="2" fill={stroke || "#000"} stroke="none" />
                <circle cx="40" cy="26" r="2" fill={stroke || "#000"} stroke="none" />

                {/* Smile */}
                <path d="M26 34C28 36 36 36 38 34" />
            </g>
        </svg>
    );
}
