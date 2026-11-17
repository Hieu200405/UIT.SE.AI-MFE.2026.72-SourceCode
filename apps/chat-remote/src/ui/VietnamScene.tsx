import React from 'react';

/** Original illustration, bundled locally. Decorative, not a cultural rule or a real location. */
export function VietnamScene({ compact = false }: { compact?: boolean }) {
  return <svg viewBox="0 0 900 360" role="img" aria-label="Illustrated Vietnamese street with tiled roofs, a phở stall, a café and a bicycle" className={compact ? 'chat:vietnam-scene chat:scene-compact' : 'chat:vietnam-scene'}>
    <rect width="900" height="360" fill="#eee3cc" />
    <circle cx="735" cy="72" r="43" fill="#dcac61" />
    <path d="M0 230Q150 195 310 218T620 210T900 220V360H0Z" fill="#d7d9be" />
    <path d="M0 298H900V360H0Z" fill="#d9c4a5" />
    <path d="M0 320H900M0 345H900" stroke="#c5ae8c" strokeWidth="2" />
    <g stroke="#674d3b" strokeWidth="2" strokeLinejoin="round">
      <path d="M48 100H220V295H48Z" fill="#dba66c" /><path d="M35 104L67 64H203L234 104Z" fill="#a34e39" />
      <path d="M45 94H225M54 83H217M64 72H207M85 66L71 103M118 66L112 103M151 66L154 103M184 66L194 103" fill="none" stroke="#cf8c66" />
      <path d="M69 128H113V178H69ZM151 128H195V178H151Z" fill="#435f4c" />
      <path d="M91 130V176M173 130V176M71 143H111M153 143H193M71 155H111M153 155H193" stroke="#79917a" />
      <path d="M65 207H203V295H65Z" fill="#4d5542" />
      <path d="M45 190H221L235 215H32Z" fill="#f1d29a" />
      <path d="M63 191L55 213M95 191L91 213M127 191V213M159 191L163 213M191 191L199 213" stroke="#ab4e39" strokeWidth="13" />
      <rect x="70" y="224" width="128" height="31" rx="2" fill="#e2bd79" />
      <text x="134" y="246" textAnchor="middle" fontFamily="Georgia,serif" fontSize="23" fontWeight="bold" fill="#704330" stroke="none">CÀ PHÊ</text>
      <rect x="250" y="139" width="169" height="157" fill="#ecd4a4" /><path d="M237 144L262 112H402L434 144Z" fill="#9e4b37" />
      <path d="M251 133H420M266 121H408M286 114L276 143M322 114L319 143M359 114L363 143M393 114L407 143" stroke="#cb8160" />
      <rect x="271" y="164" width="127" height="40" rx="2" fill="#275d4c" /><text x="334" y="193" fontSize="28" fontFamily="Georgia,serif" textAnchor="middle" fill="#f7e6be" stroke="none">PHỞ</text>
      <path d="M273 220H397V296H273Z" fill="#8b8461" /><path d="M284 228H385V257H284Z" fill="#b2c0a0" />
      <path d="M265 266H408V297H265Z" fill="#bb7851" /><ellipse cx="305" cy="263" rx="18" ry="5" fill="#f2e9cf" /><path d="M287 264Q305 285 323 264" fill="#f2e9cf" />
      <path d="M300 251Q292 242 301 234M311 251Q320 243 312 234" fill="none" stroke="#f5eed9" />
      <rect x="452" y="87" width="156" height="210" fill="#c5be8c" /><path d="M438 92L466 54H592L620 92Z" fill="#a75f45" />
      <path d="M452 81H608M460 69H600M482 57L472 90M514 57L511 90M546 57L550 90M578 57L589 90" stroke="#cc9368" />
      <path d="M474 116H513V165H474ZM548 116H587V165H548Z" fill="#496450" /><path d="M494 116V165M568 116V165" stroke="#a3ae83" />
      <path d="M472 183H588M480 178V196M502 178V196M524 178V196M546 178V196M568 178V196M588 178V196" stroke="#5e6f51" />
      <path d="M488 220Q530 188 572 220V297H488Z" fill="#385344" /><path d="M530 207V297" stroke="#a1a77b" />
      <rect x="652" y="185" width="192" height="112" fill="#d6a973" /><path d="M638 186L669 151H829L855 186Z" fill="#9c503c" />
      <path d="M650 177H845M659 165H836" stroke="#cb8f69" />
      <path d="M670 213H828V298H670Z" fill="#5a674b" /><rect x="688" y="225" width="124" height="34" fill="#f0d5a4" />
      <text x="750" y="249" textAnchor="middle" fontSize="20" fontFamily="Georgia,serif" fill="#8f4931" stroke="none">BÁNH MÌ</text>
    </g>
    <path d="M14 82Q432 190 884 85" fill="none" stroke="#6d6c4c" strokeWidth="2" />
    {[244, 433, 634, 810].map((x, i) => <g key={x} transform={`translate(${x} ${[126, 139, 130, 102][i]})`}><path d="M0 0V12" stroke="#69583d" /><ellipse cy="26" rx="12" ry="17" fill={i % 2 ? '#b86542' : '#d3a246'} /><path d="M0 10Q-9 26 0 43Q9 26 0 10M-10 22H10M-10 30H10" fill="none" stroke="#ecc580" strokeWidth="1" /><path d="M0 43V51" stroke="#9b5136" /></g>)}
    <g stroke="#3f5142" strokeWidth="3" fill="none"><circle cx="198" cy="312" r="23" /><circle cx="275" cy="312" r="23" /><path d="M198 312L223 272L251 312ZM223 272L261 272L275 312M251 312L261 260H273M216 269H235" /><path d="M268 263H289V279H274" fill="#bc9870" strokeWidth="2" /></g>
    <g fill="#35674d"><path d="M23 300Q-12 233 27 209Q54 256 23 300M27 289Q47 221 74 240Q79 270 27 289" /><path d="M866 296Q830 215 870 196Q903 249 866 296M866 274Q885 218 914 227V263Z" /></g>
    <path d="M12 282H40L36 314H17ZM851 282H883L879 316H857Z" fill="#b36949" />
    <g fill="#b45538"><path d="M345 298H371V306H345ZM348 306H353V326H348ZM364 306H369V326H364ZM397 299H423V307H397ZM400 307H405V327H400ZM416 307H421V327H416Z" /></g>
  </svg>;
}
