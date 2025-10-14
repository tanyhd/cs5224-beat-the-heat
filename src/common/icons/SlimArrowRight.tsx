export default function SlimArrowRight({ stroke, ...rest }: { stroke?: string, [rest: string]: any }) {
   return (
      <svg width="6" height="11" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
         <path d="M0.809998 9.43018L4.81 5.43018L0.809998 1.43018" stroke={stroke || "#6B7280"} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
   )
}