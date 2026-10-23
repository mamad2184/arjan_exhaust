import './CarHeadlightAnimation.css'

export default function CarHeadlightAnimation() {
  return (
    <span className="sidebar-car-animation">
      <svg
        className="animated-car"
        viewBox="0 0 120 48"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Samand body silhouette */}
        <path
          d="M5 30
             L8 25
             Q10 22 18 21
             L29 12
             Q33 9 41 9
             L68 9
             Q76 10 82 17
             L91 23
             L108 26
             Q113 28 114 32
             L114 36
             L5 36
             Z"
          fill="#cbd8d2"
          stroke="#667f75"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />

        {/* Front windshield */}
        <path
          d="M31 20 L41 11 L53 11 L53 20 Z"
          fill="#294440"
          stroke="#81988e"
          strokeWidth="0.8"
        />

        {/* Rear passenger windows */}
        <path
          d="M56 11 L68 11 Q74 12 79 19 L56 19 Z"
          fill="#294440"
          stroke="#81988e"
          strokeWidth="0.8"
        />

        {/* Rear quarter window */}
        <path
          d="M72 12 Q76 13 80 19 L83 21 L74 20 Z"
          fill="#294440"
          stroke="#81988e"
          strokeWidth="0.7"
        />

        {/* Window pillars */}
        <path
          d="M54 10 L54 30 M72 12 L76 30"
          fill="none"
          stroke="#82998e"
          strokeWidth="1.2"
        />

        {/* Four-door body lines */}
        <path
          d="M28 22 L28 33 M55 21 L55 34 M82 22 L83 34"
          fill="none"
          stroke="#91a69c"
          strokeWidth="0.8"
        />

        {/* Side door handles */}
        <path
          d="M35 24 L41 24 M61 24 L67 24"
          stroke="#516c61"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Side molding */}
        <path
          d="M10 28 L105 29"
          stroke="#52655d"
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        {/* Mirror */}
        <path
          d="M29 19 L25 18 L23 20 L29 22 Z"
          fill="#cbd8d2"
          stroke="#667f75"
          strokeWidth="0.8"
        />

        {/* Rear light */}
        <path
          d="M7 25 L12 25 L13 29 L7 30 Z"
          fill="#c85d55"
        />

        {/* Front grille */}
        <path
          d="M106 28 L112 29 L112 32 L106 32 Z"
          fill="#52655d"
        />
        <path
          d="M107 29 L111 29 M107 30.5 L111 30.5"
          stroke="#cbd8d2"
          strokeWidth="0.5"
        />

        {/* Headlights */}
        <path
          className="car-headlight car-headlight-left"
          d="M105 25 L112 27 L112 29 L105 28 Z"
        />
        <path
          className="car-headlight car-headlight-right"
          d="M106 29 L113 30 L113 32 L106 32 Z"
        />

        {/* Wheels */}
        <g className="car-wheels">
          <circle cx="27" cy="35" r="7" fill="#253330" />
          <circle cx="27" cy="35" r="4.2" fill="#aab9b1" />
          <circle cx="27" cy="35" r="2.2" fill="#52675d" />
          <circle cx="27" cy="35" r="0.9" fill="#e7eee9" />

          <circle cx="87" cy="35" r="7" fill="#253330" />
          <circle cx="87" cy="35" r="4.2" fill="#aab9b1" />
          <circle cx="87" cy="35" r="2.2" fill="#52675d" />
          <circle cx="87" cy="35" r="0.9" fill="#e7eee9" />
        </g>
      </svg>
    </span>
  )
}