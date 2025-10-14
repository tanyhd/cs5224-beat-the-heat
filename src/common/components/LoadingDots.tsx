export default function LoadingDots () {
   return (
   <>
      <span>
         {Array.from({ length: 5 }).map((_, i) => (
            <span
               key={i}
               style={{
                  animation: `dots 2s infinite`,
                  animationDelay: `${i * 0.6}s`,
                  opacity: 0,
               }}
            >
               .
            </span>
         ))}
      </span>
      <style>
         {`
            @keyframes dots {
               0% { opacity: 0; }
               20% { opacity: 1; }
               100% { opacity: 0; }
            }
         `}
      </style>
   </>)
}