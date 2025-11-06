// Utility function to create shelter marker icons for Google Maps

export function createShelterMarkerIcon(number: number): google.maps.Icon {
  // Create SVG with shelter/umbrella icon and numbered badge
  const svg = `
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <!-- Shelter/Umbrella Icon Background Circle -->
      <circle cx="24" cy="24" r="20" fill="#06B6D4" opacity="0.15"/>
      <circle cx="24" cy="24" r="18" fill="#06B6D4" stroke="white" stroke-width="2"/>

      <!-- Umbrella/Shelter Icon -->
      <g transform="translate(24, 24)">
        <!-- Umbrella top -->
        <path d="M -10 -2 Q -10 -8, -5 -10 Q 0 -12, 5 -10 Q 10 -8, 10 -2 L 8 -2 Q 8 -6, 5 -7 Q 0 -8, -5 -7 Q -8 -6, -8 -2 Z"
              fill="white" stroke="white" stroke-width="1"/>
        <!-- Umbrella pole -->
        <line x1="0" y1="-2" x2="0" y2="6" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <!-- Umbrella handle -->
        <path d="M 0 6 Q 2 8, 4 7" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </g>

      <!-- Number Badge (top-right corner) -->
      <circle cx="38" cy="10" r="9" fill="#FF5722" stroke="white" stroke-width="2"/>
      <text x="38" y="10" font-size="11" font-weight="bold" fill="white"
            text-anchor="middle" dominant-baseline="central">${number}</text>
    </svg>
  `;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(48, 48),
    anchor: new google.maps.Point(24, 24),
  };
}
