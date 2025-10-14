import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LoadingDots from './LoadingDots';

interface LoadingProps {
   text?: string;
   children?: React.ReactNode;
}

export default function Loading({text, children}: LoadingProps) {
   return (
      <>
      <div style={{ width: '150px', height: '150px', margin: '0 auto 24px' }}>
         <DotLottieReact
         src="/loading-animation.lottie"
         loop
         autoplay
         />
         {!children && <div style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
            {text || 'Loading'}
            <LoadingDots />
         </div>}
    </div>
    {children}
    </>
   )
}