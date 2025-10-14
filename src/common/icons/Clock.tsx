export default function Clock({ stroke, ...rest }: { stroke?: string, [rest: string]: any }) {
   return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
         <g clipPath="url(#clip0_4_1125)">
            <path d="M10 4.99984V9.99984L13.3333 11.6665M18.3333 9.99984C18.3333 14.6022 14.6024 18.3332 10 18.3332C5.39762 18.3332 1.66666 14.6022 1.66666 9.99984C1.66666 5.39746 5.39762 1.6665 10 1.6665C14.6024 1.6665 18.3333 5.39746 18.3333 9.99984Z" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         </g>
         <defs>
            <clipPath id="clip0_4_1125">
               <rect width="20" height="20" fill="white" />
            </clipPath>
         </defs>
      </svg>
   )
}