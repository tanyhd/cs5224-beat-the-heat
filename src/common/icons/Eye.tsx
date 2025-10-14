export default function Eye({ stroke, ...rest }: { stroke?: string, [rest: string]: any }) {
   return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
         <g clipPath="url(#clip0_4_1004)">
            <path d="M0.833252 9.99992C0.833252 9.99992 4.16658 3.33325 9.99992 3.33325C15.8333 3.33325 19.1666 9.99992 19.1666 9.99992C19.1666 9.99992 15.8333 16.6666 9.99992 16.6666C4.16658 16.6666 0.833252 9.99992 0.833252 9.99992Z" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.99992 12.4999C11.3806 12.4999 12.4999 11.3806 12.4999 9.99992C12.4999 8.61921 11.3806 7.49992 9.99992 7.49992C8.61921 7.49992 7.49992 8.61921 7.49992 9.99992C7.49992 11.3806 8.61921 12.4999 9.99992 12.4999Z" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         </g>
         <defs>
            <clipPath id="clip0_4_1004">
               <rect width="20" height="20" fill="white" />
            </clipPath>
         </defs>
      </svg>
   )
}