export function MovementArt() {
  return <div className="movement-art" aria-hidden="true">
    <svg viewBox="0 0 480 400" fill="none" role="presentation">
      <defs>
        <linearGradient id="orbit-gradient" x1="90" y1="80" x2="360" y2="360" gradientUnits="userSpaceOnUse"><stop stopColor="#C6F36A" stopOpacity=".6"/><stop offset="1" stopColor="#C6F36A" stopOpacity=".04"/></linearGradient>
        <linearGradient id="runner-gradient" x1="260" y1="110" x2="245" y2="310" gradientUnits="userSpaceOnUse"><stop stopColor="#DEFF9A"/><stop offset="1" stopColor="#8FBA42"/></linearGradient>
        <radialGradient id="art-glow"><stop stopColor="#ADDE52" stopOpacity=".12"/><stop offset="1" stopColor="#ADDE52" stopOpacity="0"/></radialGradient>
      </defs>
      <circle cx="255" cy="205" r="180" fill="url(#art-glow)"/>
      <g stroke="url(#orbit-gradient)">
        <ellipse cx="255" cy="210" rx="164" ry="145" transform="rotate(-28 255 210)"/>
        <ellipse cx="255" cy="210" rx="137" ry="120" transform="rotate(-28 255 210)"/>
        <ellipse cx="255" cy="210" rx="111" ry="95" transform="rotate(-28 255 210)"/>
        <path d="M68 211H440M255 33V376" strokeDasharray="3 8" opacity=".35"/>
      </g>
      <g className="art-orbit-marks" stroke="#C6F36A" strokeWidth="2"><path d="M102 137V124H115M399 268V281H386"/><circle cx="132" cy="304" r="3" fill="#C6F36A"/><circle cx="393" cy="112" r="3" fill="#C6F36A"/></g>
      <g fill="url(#runner-gradient)">
        <circle cx="291" cy="112" r="20"/>
        <path d="M267 145C274 137 286 140 289 150L302 184L339 175C347 173 352 178 352 185C352 190 349 193 344 195L298 209C291 211 286 208 283 202L273 183L252 216L278 241C282 245 284 250 282 256L261 311C258 319 253 322 247 319C242 317 240 312 243 305L256 261L228 242L210 268L169 288C161 292 155 290 152 284C149 277 153 273 159 270L191 251L213 209L237 162L210 172L194 193C189 199 184 200 179 196C174 192 175 187 178 182L197 153C199 150 202 148 206 147L245 134C253 132 261 136 267 145Z"/>
      </g>
      <g stroke="#C6F36A" opacity=".3" strokeLinecap="round"><path d="M149 207H183M131 221H174M148 235H164M313 289H347M309 303H365"/></g>
      <text x="86" y="72" className="art-label">MOVE WITH PURPOSE</text>
      <text x="314" y="352" className="art-label">BUILT FOR YOU</text>
    </svg>
  </div>;
}
