export default function Info({ stroke, ...rest }: { stroke?: string, [rest: string]: any }) {
   return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
         <g clipPath="url(#clip0_4_1296)">
            <path d="M10.0001 13.3332V9.99984M10.0001 6.6665H10.0084M18.3334 9.99984C18.3334 14.6022 14.6025 18.3332 10.0001 18.3332C5.39771 18.3332 1.66675 14.6022 1.66675 9.99984C1.66675 5.39746 5.39771 1.6665 10.0001 1.6665C14.6025 1.6665 18.3334 5.39746 18.3334 9.99984Z" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         </g>
         <defs>
            <clipPath id="clip0_4_1296">
               <rect width="20" height="20" fill="white" />
            </clipPath>
         </defs>
      </svg>
   )
}