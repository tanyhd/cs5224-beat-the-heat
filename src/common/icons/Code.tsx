export default function Code({ stroke, ...rest }: { stroke?: string, [rest: string]: any }) {
   return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
         <path d="M13.3332 15L18.3332 10L13.3332 5M6.6665 5L1.6665 10L6.6665 15" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
   )
}
