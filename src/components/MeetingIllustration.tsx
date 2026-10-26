export default function MeetingIllustration() {
  return (
    <svg className="meeting-illustration" viewBox="0 0 900 480" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="meeting-wall" x2="0" y2="1">
          <stop stopColor="#f6dcac" /><stop offset="1" stopColor="#cda487" />
        </linearGradient>
        <radialGradient id="meeting-sun">
          <stop stopColor="#fffde1" /><stop offset=".35" stopColor="#ffe5a0" stopOpacity=".9" /><stop offset="1" stopColor="#ffd58b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="meeting-floor" x2=".2" y2="1">
          <stop stopColor="#ad8068" /><stop offset="1" stopColor="#5f4946" />
        </linearGradient>
        <linearGradient id="meeting-table" x2=".2" y2="1">
          <stop stopColor="#c59772" /><stop offset="1" stopColor="#805645" />
        </linearGradient>
        <pattern id="meeting-knit" width="9" height="12" patternUnits="userSpaceOnUse">
          <path d="m1-2 3.5 11L8-2m-7 2 3.5 11L8 0" stroke="#fff6dc" strokeOpacity=".35" strokeWidth="1.1" />
          <path d="m1 1 3.5 10L8 1" stroke="#392c28" strokeOpacity=".15" />
        </pattern>
        <pattern id="meeting-tweed" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="m-4 0 8 8m0-8 8 8M0 0v8m4-8v8" stroke="#f2dec1" strokeOpacity=".25" strokeWidth=".7" />
          <path d="M0 2h8M0 6h8" stroke="#241f1b" strokeOpacity=".2" />
        </pattern>
        <pattern id="meeting-grain" width="120" height="17" patternUnits="userSpaceOnUse">
          <path d="M0 3q30-5 60 0t60 0M0 9q30-4 60 0t60 0M0 14q30-3 60 0t60 0" stroke="#edc096" strokeOpacity=".2" />
        </pattern>
        <filter id="meeting-shadow" x="-.3" y="-.3" width="1.6" height="1.7">
          <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#4a312b" floodOpacity=".25" />
        </filter>
        <filter id="meeting-texture" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="14" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="soft-light" />
        </filter>
        <filter id="meeting-soft"><feGaussianBlur stdDeviation="1.1" /></filter>
        <g id="meeting-face">
          <path d="M-25-22q-3-30 25-32 29 1 26 34l-4 30Q14 34 0 35-17 32-24 10Z" fill="currentColor" stroke="#80583e" strokeWidth="1.3" />
          <ellipse cx="-25" cy="-1" rx="5" ry="8" fill="currentColor" /><ellipse cx="25" cy="-1" rx="5" ry="8" fill="currentColor" />
          <path d="M-18-13q6-5 12-1m12 0q6-5 12-1" stroke="#50392e" strokeWidth="2" strokeLinecap="round" />
          <path d="M-15-3q3-5 7 0m16 0q3-5 7 0" stroke="#352d2b" strokeWidth="2.4" strokeLinecap="round" />
          <path d="m0-3-3 13 5 1" stroke="#aa7450" strokeWidth="1.4" strokeLinecap="round" />
          <ellipse cx="-16" cy="11" rx="6" ry="3.5" fill="#c77c67" opacity=".65" /><ellipse cx="16" cy="11" rx="6" ry="3.5" fill="#c77c67" opacity=".65" />
          <path d="M-9 19q9 12 18-1-9 5-18 1Z" fill="#894a40" /><path d="M-6 21q6 3 12-1" stroke="#f8e7cf" strokeWidth="2.4" />
        </g>
        <g id="meeting-bob">
          <path d="M-28-4q-12-48 19-54 38-12 43 34l-2 22q-2 17 13 24-18 14-27-2L-21 23q-17 11-24-2 16-6 17-25Z" fill="#443228" stroke="#70503a" strokeWidth="2" />
          <path d="M-24-20q13-6 17-25 10 21 30 25l-4-23-29-9-18 17Z" fill="#443228" />
          {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${-23 + i * 5}-37q${i < 5 ? -12 : 12}-7 ${i < 5 ? -7 : 7} 40t${i < 5 ? -7 : 7} 18`} stroke={i % 2 ? "#a17c54" : "#6f4c35"} strokeWidth="1.5" />)}
        </g>
      </defs>
      <path fill="url(#meeting-wall)" d="M0 0h900v480H0z" />
      <g filter="url(#meeting-soft)">
        <path fill="#9d775f" d="M0 317h900v163H0z" />
        <path fill="url(#meeting-floor)" d="M0 326h900v154H0z" />
        {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M0 ${332 + i * 22}H900`} stroke="#4e3d39" strokeOpacity=".4" />)}
        <path d="m120 324-80 156m240-156-35 156m195-156 20 156m130-156 70 156" stroke="#4e3d39" strokeOpacity=".3" />
        <path fill="#d5b789" stroke="#a47e53" strokeWidth="7" d="M604-12h225v294H604z" />
        <path fill="#efd49e" d="M614 0h205v272H614z" />
        <circle cx="727" cy="84" r="140" fill="url(#meeting-sun)" />
        <path d="M717 0v274M614 140h205" stroke="#f8e7bf" strokeWidth="9" />
        <path d="M598 4h-31v286h47ZM835 4h30v286h-46Z" fill="#849078" />
        <path d="M574 12v265m14-265v265m256-265v265m12-265v265" stroke="#63735f" strokeWidth="2" opacity=".6" />
        <path d="M44 52h459v221H44z" fill="#9c7651" stroke="#8f6b47" strokeWidth="6" />
        <path d="M52 60h443v205H52z" fill="#e8d8b9" />
        <path d="M60 68h427v189H60z" fill="#475d50" />
        <path d="M84 93h117m-117 12h80M83 239h157" stroke="#c7c9ae" strokeWidth="3" strokeLinecap="round" />
        <path d="M99 224v-47h23v47m22 0v-70h23v70m22 0v-98h23v98" fill="#d6ac63" />
        <path d="m93 161 53-28 50-23 24-14m-14-1 15 1-2 15" stroke="#e7d9ae" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="m618 173 282 76v202l-433-98Z" fill="#fbdba0" opacity=".12" />

      {/* Presenter: embroidered cream jacket, glasses and swept yarn hair. */}
      <g transform="translate(395 136)" filter="url(#meeting-shadow)">
        <path d="M-33-9q-12-48 23-58 47-7 48 45l12 125-23 11-56-14Z" fill="#62462e" />
        <path d="M-34 201h69l8 85-29 4-12-61-9 63-29-3Z" fill="#51463c" />
        <path d="M-26 48q25-18 52 0l20 38-7 114q-36 15-78-2l5-105-33 22-56-29 10-21 45 17Z" fill="#eee1c6" stroke="#a28e70" strokeWidth="2" />
        <path d="M-26 48q25-18 52 0l20 38-7 114q-36 15-78-2l5-105-33 22-56-29 10-21 45 17Z" fill="url(#meeting-knit)" />
        <path d="m-14 45 14 22 15-22M0 67v126m-30-59 22 2v29l-23-1m39-28 23-1v29l-23 1" stroke="#b5a48a" strokeWidth="2" />
        <path d="m-13 46-10 26 17 19M15 46l10 25-17 19" stroke="#d0bda0" strokeWidth="4" />
        {[92, 111, 130].map(y => <circle key={y} cy={y} r="3" fill="#b18d51" stroke="#80623c" />)}
        <path d="m-111 72-15-8-14-17q-4-4-6-1-2 2 6 17l-13-6q-7 0-2 6l21 18 18 9" fill="#dbad82" stroke="#9b7050" strokeWidth="1.4" />
        <path d="m-147 49-27-51" stroke="#bf9c6c" strokeWidth="3" strokeLinecap="round" />
        <path d="M27 75q23 23 15 52l-21 24-15-13 18-24-12-22" fill="#ede0c4" stroke="#b3a086" strokeWidth="2" />
        <path d="m22 139-12 3-8 11q-4 6 3 7l20-9" fill="#dbad82" stroke="#9b7050" strokeWidth="1.3" />
        <path d="M-8 25v22q9 10 18-1V25" fill="#dbad82" />
        {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${-24 + i * 2.8} -35q-12 20 -4 39t-3 67`} stroke={i % 3 ? "#9d7849" : "#d0a86c"} strokeWidth="1.3" opacity=".9" />)}
        <use href="#meeting-face" color="#dfb18b" />
        <path d="M-27-13q16-7 24-34 10 23 30 30l-4-28-25-13-24 18Z" fill="#5b402c" />
        <path d="M-21-23q10-7 17-22m-13 12q10-6 15-16m4 3q5 15 19 22m-15-24q8 16 17 20" stroke="#bc925d" strokeWidth="1.5" />
        <ellipse cx="6" cy="-57" rx="22" ry="14" fill="#6c4c30" stroke="#b78c54" strokeWidth="2" />
        <path d="M-10-64q25-8 31 8m-34-2q24-6 32 7m-29-1q19-4 27 6" stroke="#bb925a" strokeWidth="2" />
        <g stroke="#493b32" strokeWidth="2">
          <ellipse cx="-13" cy="-1" rx="11" ry="10" /><ellipse cx="13" cy="-1" rx="11" ry="10" /><path d="M-2-2h4m-27-2-4-4m54 4 4-4" />
        </g>
        <circle cx="27" cy="13" r="4" fill="#dcb65a" />
      </g>

      {/* A listening colleague with a long olive cardigan. */}
      <g transform="translate(687 185)" filter="url(#meeting-shadow)">
        <path d="M-30-20q-6-49 25-52 47-8 48 43l15 104-43 24-52-18Z" fill="#433a2d" />
        <path d="M-24 42q23-15 48 0l30 89-13 58h-87l-10-61Z" fill="#6c7653" stroke="#46543d" strokeWidth="2" />
        <path d="M-24 42q23-15 48 0l30 89-13 58h-87l-10-61Z" fill="url(#meeting-tweed)" />
        <path d="m-10 42 8 50 17-50-6 135" fill="#d4bf8e" /><path d="m-22 47-10 36 13 11m42-47 13 35-14 12" stroke="#a0a17b" strokeWidth="3" />
        <path d="M-10 23v20q9 9 18-1V23" fill="#c4936f" />
        {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${-21 + i * 5}-46q17 26 11 51t9 53`} stroke={i % 2 ? "#806848" : "#64573b"} strokeWidth="2" />)}
        <use href="#meeting-face" color="#cda17d" />
        <path d="M-26-22q25-3 29-30 28 15 25 49l9-35-25-29-32 12Z" fill="#44392c" />
        <path d="M-21-29q17-4 23-24m5 1q23 16 19 48m-14-43q19 21 16 48" stroke="#8d7954" strokeWidth="1.5" />
        <path d="m-25 92-22 35-39 11 3 17 53-12 25-28" fill="#74805b" stroke="#46543d" strokeWidth="2" />
        <path d="m-84 138-18 2-9 9q-2 8 6 7l24-6" fill="#cda17d" stroke="#946849" />
      </g>

      <g filter="url(#meeting-shadow)">
        <path d="m231 289-37 191h27l49-180m368-8 49 188h28l-38-191" fill="#584339" />
        <path d="m257 258 342-3 222 155-724 12Z" fill="url(#meeting-table)" stroke="#76513d" strokeWidth="3" />
        <path d="m257 258 342-3 222 155-724 12Z" fill="url(#meeting-grain)" />
        <path d="m97 422 724-12v13l-724 14Z" fill="#684936" />
        <path d="m269 269 321-2 190 133-642 10Z" stroke="#d4b18a" strokeOpacity=".65" />
      </g>
      <g fill="#f2e5cd" stroke="#bba789">
        <path d="m335 287 54-2 30 24-57 3Z" /><path d="m530 306 54 4-21 29-55-6Z" />
        <path d="m380 357 65-3 28 35-70 3Z" />
      </g>
      <path d="m349 291 34-1m-28 6 34-1m144 19 31 3m-35 4 29 3m-130 39 37-2m-32 8 37-2" stroke="#879182" strokeWidth="1.5" />
      {[{ x: 308, y: 305 }, { x: 603, y: 350 }].map(({ x, y }) => <g key={x} transform={`translate(${x} ${y})`}>
        <ellipse cy="13" rx="19" ry="6" fill="#73533e" opacity=".5" />
        <path d="M-11-11h22v20q-11 11-22 0Z" fill="#e3d6b9" stroke="#a48c69" strokeWidth="1.5" />
        <ellipse cy="-11" rx="11" ry="4" fill="#5b4537" stroke="#e7d9be" strokeWidth="2" />
        <path d="M11-7q16-2 12 10-4 5-12 2" stroke="#ddcaa5" strokeWidth="4" />
        <path d="M-3-20q-6-8 0-15m9 14q-5-8 0-15" stroke="#fff0cb" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
      </g>)}

      {/* Foreground colleague, shown in three-quarter profile. */}
      <g transform="translate(208 238)" filter="url(#meeting-shadow)">
        <path d="M-52 109h101l15 133H-65Z" fill="#665047" stroke="#493b33" strokeWidth="3" />
        <path d="M-37 47q27-17 56-5l26 58-10 80-91 1-5-81Z" fill="#8c6851" stroke="#5d4436" strokeWidth="2" />
        <path d="M-37 47q27-17 56-5l26 58-10 80-91 1-5-81Z" fill="url(#meeting-tweed)" />
        <path d="m-13 47 9 46 20-47-4 115" fill="#f0e3c8" />
        <path d="m-29 49-11 27 17 15m41-43 15 25-14 17m-64 31 23 1v25l-23-1" stroke="#b49270" strokeWidth="2" />
        <path d="M-6 24v23q10 8 19-3V23" fill="#d2a17c" />
        <use href="#meeting-bob" />
        <g transform="rotate(-12)"><use href="#meeting-face" color="#dfb18a" /></g>
        <path d="M-29-17q18-9 22-31 12 21 29 25l-2-18-28-17-21 16Z" fill="#483328" />
        <path d="M-23-35q-12 29-4 48m10-55q-8 23-6 40m12-44q-3 18 19 27m-14-31q4 20 20 24" stroke="#a27c52" strokeWidth="2" />
        <path d="m27 88 28 31 65-4 4 19-79 10-37-30" fill="#957058" stroke="#5d4436" strokeWidth="2" />
        <path d="m120 115 18-3 16 9q7 5 1 8l-17-4-15 8" fill="#dfb18a" stroke="#9e7251" strokeWidth="1.3" />
        <path d="m143 112 19-27" stroke="#3f4d4b" strokeWidth="3" strokeLinecap="round" />
        <path d="M-46 95q-16 50 7 63l55-1v-19l-42-5 4-26" fill="#8c6851" stroke="#5d4436" strokeWidth="2" />
        <path d="m13 139 17-3 12 8q6 4 0 7l-13-2-16 8" fill="#dfb18a" stroke="#9e7251" strokeWidth="1.3" />
      </g>
      <path d="M0 0h900v480H0z" fill="#b7a28b" opacity=".055" filter="url(#meeting-texture)" pointerEvents="none" />
    </svg>
  );
}
