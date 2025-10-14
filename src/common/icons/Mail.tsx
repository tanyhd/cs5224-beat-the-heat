export default function Mail({ stroke, ...rest }: { stroke?: string ,  [rest: string]: any}) {
   return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
         <path d="M18.3334 4.99992C18.3334 4.08325 17.5834 3.33325 16.6667 3.33325H3.33341C2.41675 3.33325 1.66675 4.08325 1.66675 4.99992M18.3334 4.99992V14.9999C18.3334 15.9166 17.5834 16.6666 16.6667 16.6666H3.33341C2.41675 16.6666 1.66675 15.9166 1.66675 14.9999V4.99992M18.3334 4.99992L10.0001 10.8333L1.66675 4.99992" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
   )
}