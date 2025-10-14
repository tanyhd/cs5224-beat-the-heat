export default function Tag ({stroke, ...rest} : {stroke?: string,  [rest: string]: any}) {return (
   <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
      <path d="M5.83317 5.83341H5.8415M17.1582 11.1751L11.1832 17.1501C11.0284 17.305 10.8446 17.428 10.6422 17.5118C10.4399 17.5957 10.223 17.6389 10.004 17.6389C9.78498 17.6389 9.5681 17.5957 9.36577 17.5118C9.16344 17.428 8.97963 17.305 8.82484 17.1501L1.6665 10.0001V1.66675H9.99984L17.1582 8.82508C17.4686 9.13735 17.6428 9.55977 17.6428 10.0001C17.6428 10.4404 17.4686 10.8628 17.1582 11.1751Z" stroke={stroke || "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
   </svg>
)}
