const CatMascot = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`animate-cat-float ${className}`}>
      <svg viewBox="0 0 200 220" width="280" height="300" xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <g className="animate-cat-breathe">
          <ellipse cx="100" cy="150" rx="55" ry="60" fill="hsl(210 70% 65%)" />
          {/* Belly */}
          <ellipse cx="100" cy="160" rx="35" ry="38" fill="hsl(210 60% 82%)" />
        </g>

        {/* Tail */}
        <g className="animate-cat-tail" style={{ transformOrigin: '145px 170px' }}>
          <path d="M145 170 Q175 140 170 100 Q168 85 158 90" stroke="hsl(210 70% 65%)" strokeWidth="12" fill="none" strokeLinecap="round" />
        </g>

        {/* Head */}
        <circle cx="100" cy="85" r="48" fill="hsl(210 70% 65%)" />
        {/* Inner face */}
        <circle cx="100" cy="90" r="35" fill="hsl(210 60% 82%)" opacity="0.4" />

        {/* Left ear */}
        <polygon points="60,50 52,10 82,42" fill="hsl(210 70% 65%)" />
        <polygon points="63,46 58,20 78,42" fill="hsl(330 70% 75%)" />

        {/* Right ear */}
        <polygon points="140,50 148,10 118,42" fill="hsl(210 70% 65%)" />
        <polygon points="137,46 142,20 122,42" fill="hsl(330 70% 75%)" />

        {/* Eyes */}
        <g className="animate-cat-blink" style={{ transformOrigin: '78px 80px' }}>
          <ellipse cx="78" cy="80" rx="10" ry="11" fill="white" />
          <ellipse cx="80" cy="80" rx="6" ry="7" fill="hsl(220 30% 15%)" />
          <circle cx="82" cy="77" r="2.5" fill="white" />
        </g>
        <g className="animate-cat-blink" style={{ transformOrigin: '122px 80px', animationDelay: '0.1s' }}>
          <ellipse cx="122" cy="80" rx="10" ry="11" fill="white" />
          <ellipse cx="120" cy="80" rx="6" ry="7" fill="hsl(220 30% 15%)" />
          <circle cx="118" cy="77" r="2.5" fill="white" />
        </g>

        {/* Nose */}
        <polygon points="100,92 96,97 104,97" fill="hsl(330 60% 55%)" />

        {/* Mouth */}
        <path d="M96 100 Q100 106 104 100" stroke="hsl(220 20% 30%)" strokeWidth="1.5" fill="none" />

        {/* Cheeks */}
        <ellipse cx="65" cy="95" rx="10" ry="6" fill="hsl(330 80% 78%)" opacity="0.5" />
        <ellipse cx="135" cy="95" rx="10" ry="6" fill="hsl(330 80% 78%)" opacity="0.5" />

        {/* Whiskers */}
        <line x1="45" y1="88" x2="72" y2="92" stroke="hsl(220 20% 40%)" strokeWidth="1" />
        <line x1="42" y1="96" x2="72" y2="96" stroke="hsl(220 20% 40%)" strokeWidth="1" />
        <line x1="128" y1="92" x2="155" y2="88" stroke="hsl(220 20% 40%)" strokeWidth="1" />
        <line x1="128" y1="96" x2="158" y2="96" stroke="hsl(220 20% 40%)" strokeWidth="1" />

        {/* Paws */}
        <ellipse cx="70" cy="200" rx="18" ry="10" fill="hsl(210 70% 65%)" />
        <ellipse cx="130" cy="200" rx="18" ry="10" fill="hsl(210 70% 65%)" />
        {/* Paw pads */}
        <circle cx="65" cy="200" r="3" fill="hsl(330 60% 70%)" />
        <circle cx="72" cy="198" r="3" fill="hsl(330 60% 70%)" />
        <circle cx="125" cy="200" r="3" fill="hsl(330 60% 70%)" />
        <circle cx="132" cy="198" r="3" fill="hsl(330 60% 70%)" />
      </svg>
    </div>
  );
};

export default CatMascot;
