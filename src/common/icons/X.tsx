export default function X({ stroke, ...rest }: { stroke?: string, [rest: string]: any }) {
   return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
         <path d="M18 6L6 18" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         <path d="M6 6L18 18" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
   )
}
