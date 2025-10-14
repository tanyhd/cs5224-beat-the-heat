export default function Grid({ stroke, ...rest }: { stroke?: string ,  [rest: string]: any}) {
   return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
         <path d="M8.33333 2.5H2.5V8.33333H8.33333V2.5Z" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         <path d="M17.5 2.5H11.6667V8.33333H17.5V2.5Z" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         <path d="M17.5 11.6667H11.6667V17.5H17.5V11.6667Z" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         <path d="M8.33333 11.6667H2.5V17.5H8.33333V11.6667Z" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
   )
}

