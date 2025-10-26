export default function Cycling({
  stroke,
  ...rest
}: {
  stroke?: string;
  [rest: string]: any;
}) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 4 4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M3.26836 3.71006C3.60985 3.71006 3.88669 3.43322 3.88669 3.09172C3.88669 2.75023 3.60985 2.47339 3.26836 2.47339C2.92686 2.47339 2.65002 2.75023 2.65002 3.09172C2.65002 3.43322 2.92686 3.71006 3.26836 3.71006Z"
        stroke={ stroke || "#064E3B"}
        strokeWidth="0.353333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0.971666 3.71006C1.31316 3.71006 1.59 3.43322 1.59 3.09172C1.59 2.75023 1.31316 2.47339 0.971666 2.47339C0.63017 2.47339 0.353333 2.75023 0.353333 3.09172C0.353333 3.43322 0.63017 3.71006 0.971666 3.71006Z"
        stroke={ stroke || "#064E3B"}
        strokeWidth="0.353333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.64999 1.06C2.74756 1.06 2.82666 0.980902 2.82666 0.883332C2.82666 0.785761 2.74756 0.706665 2.64999 0.706665C2.55242 0.706665 2.47333 0.785761 2.47333 0.883332C2.47333 0.980902 2.55242 1.06 2.64999 1.06Z"
        stroke={ stroke || "#064E3B"}
        strokeWidth="0.353333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.12003 3.09166V2.47333L1.59003 1.94333L2.29669 1.41333L2.65003 1.94333H3.00336"
        stroke={ stroke || "#064E3B"}
        strokeWidth="0.353333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
