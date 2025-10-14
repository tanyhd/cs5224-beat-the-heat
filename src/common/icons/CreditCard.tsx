export default function CreditCard({ stroke, ...rest }: { stroke?: string, [rest: string]: any }) {
   return (
      <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
         <g clipPath="url(#clip0_4_404)">
            <path d="M1.56323 8.90308H19.8966M3.2299 3.90308H18.2299C19.1504 3.90308 19.8966 4.64927 19.8966 5.56974V15.5697C19.8966 16.4902 19.1504 17.2364 18.2299 17.2364H3.2299C2.30942 17.2364 1.56323 16.4902 1.56323 15.5697V5.56974C1.56323 4.64927 2.30942 3.90308 3.2299 3.90308Z" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         </g>
         <defs>
            <clipPath id="clip0_4_404">
               <rect width="20" height="20" fill="white" transform="translate(0.72998 0.569824)" />
            </clipPath>
         </defs>
      </svg>
   )
}


