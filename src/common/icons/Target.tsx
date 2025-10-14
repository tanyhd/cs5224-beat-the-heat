export default function Target({ stroke, ...rest }: { stroke?: string, [rest: string]: any }) {
   return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
         <g clipPath="url(#clip0_4_829)">
            <path d="M9.99984 18.3332C14.6022 18.3332 18.3332 14.6022 18.3332 9.99984C18.3332 5.39746 14.6022 1.6665 9.99984 1.6665C5.39746 1.6665 1.6665 5.39746 1.6665 9.99984C1.6665 14.6022 5.39746 18.3332 9.99984 18.3332Z" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.99984 14.9998C12.7613 14.9998 14.9998 12.7613 14.9998 9.99984C14.9998 7.23841 12.7613 4.99984 9.99984 4.99984C7.23841 4.99984 4.99984 7.23841 4.99984 9.99984C4.99984 12.7613 7.23841 14.9998 9.99984 14.9998Z" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.99984 11.6665C10.9203 11.6665 11.6665 10.9203 11.6665 9.99984C11.6665 9.07936 10.9203 8.33317 9.99984 8.33317C9.07936 8.33317 8.33317 9.07936 8.33317 9.99984C8.33317 10.9203 9.07936 11.6665 9.99984 11.6665Z" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         </g>
         <defs>
            <clipPath id="clip0_4_829">
               <rect width="20" height="20" fill="white" />
            </clipPath>
         </defs>
      </svg>

   )
}