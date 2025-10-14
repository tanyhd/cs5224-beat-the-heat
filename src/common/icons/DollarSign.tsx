export default function DollarSign({ stroke, ...rest }: { stroke?: string, [rest: string]: any }) {
   return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
         <g clipPath="url(#clip0_4_1100)">
            <path d="M10 0.833496V19.1668M14.1667 4.16683H7.91667C7.14312 4.16683 6.40125 4.47412 5.85427 5.0211C5.30729 5.56808 5 6.30995 5 7.0835C5 7.85704 5.30729 8.59891 5.85427 9.14589C6.40125 9.69287 7.14312 10.0002 7.91667 10.0002H12.0833C12.8569 10.0002 13.5987 10.3075 14.1457 10.8544C14.6927 11.4014 15 12.1433 15 12.9168C15 13.6904 14.6927 14.4322 14.1457 14.9792C13.5987 15.5262 12.8569 15.8335 12.0833 15.8335H5" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         </g>
         <defs>
            <clipPath id="clip0_4_1100">
               <rect width="20" height="20" fill="white" />
            </clipPath>
         </defs>
      </svg>
   )
}