export default function extractDays(input: string): number | null {
   if (!input) {return 0}
   const match = input.match(/(\d+)\s*days/i);
   return match ? parseInt(match[1], 10) : 0;
}