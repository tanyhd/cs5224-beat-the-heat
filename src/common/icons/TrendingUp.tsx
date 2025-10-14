export default function TrendingUp({stroke, ...rest}: {stroke?: string,  [rest: string]: any}) {
   return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
         <g clipPath="url(#clip0_4_447)">
            <path d="M19.1668 5L11.2502 12.9167L7.0835 8.75L0.833496 15M19.1668 5H14.1668M19.1668 5L19.1668 10" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         </g>
         <defs>
            <clipPath id="clip0_4_447">
               <rect width="20" height="20" fill="white" />
            </clipPath>
         </defs>
      </svg>
   )
}