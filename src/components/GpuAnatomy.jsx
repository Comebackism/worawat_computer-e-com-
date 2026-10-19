import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './GpuAnatomy.css';

const PARTS = [
  { id: 'pcb', titleKey: 'home.anatomy.pcbTitle', bodyKey: 'home.anatomy.pcbBody' },
  { id: 'die', titleKey: 'home.anatomy.dieTitle', bodyKey: 'home.anatomy.dieBody' },
  { id: 'vram', titleKey: 'home.anatomy.vramTitle', bodyKey: 'home.anatomy.vramBody' },
  { id: 'cooling', titleKey: 'home.anatomy.coolingTitle', bodyKey: 'home.anatomy.coolingBody' },
  { id: 'fans', titleKey: 'home.anatomy.fansTitle', bodyKey: 'home.anatomy.fansBody' },
];

function useMediaQuery(query, fallback = false) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? fallback : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

function useScrollProgress(ref, enabled) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (!enabled) {
      el.style.setProperty('--p', '1');
      return undefined;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const { top, height } = el.getBoundingClientRect();
      const travel = height - window.innerHeight;
      const progress = travel > 0 ? Math.min(1, Math.max(0, -top / travel)) : 0;
      el.style.setProperty('--p', progress.toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, enabled]);
}

function Fan({ cx, cy, rotation = 0 }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r="100" fill="url(#gpu-fan-face)" />
      <g transform={`rotate(${rotation})`}>
        {Array.from({ length: 11 }, (_, i) => (
          <path
            key={i}
            transform={`rotate(${(i * 360) / 11})`}
            d="M0 -20 C 8 -44, 18 -66, 32 -86 A 92 92 0 0 1 58 -70 C 44 -48, 24 -28, 0 -20 Z"
            fill="url(#gpu-blade)"
          />
        ))}
      </g>
      <circle r="30" fill="url(#gpu-hub)" stroke="#6b7790" strokeWidth="1" />
      <circle r="13" fill="#1d2433" stroke="#5c6981" strokeWidth="1" />
      <circle r="100" fill="none" stroke="#3b4658" strokeWidth="3" />
      <circle r="95" fill="none" stroke="#495568" strokeWidth="1" opacity="0.5" />
    </g>
  );
}

function BoardLayer() {
  return (
    <svg viewBox="0 0 640 256" aria-hidden="true">
      <defs>
        <linearGradient id="gpu-pcb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2637" />
          <stop offset="0.55" stopColor="#161d2b" />
          <stop offset="1" stopColor="#101623" />
        </linearGradient>
        <linearGradient id="gpu-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8c766" />
          <stop offset="1" stopColor="#9d7a22" />
        </linearGradient>
        <linearGradient id="gpu-plate" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c3cedf" />
          <stop offset="0.45" stopColor="#8e9aad" />
          <stop offset="1" stopColor="#5f6977" />
        </linearGradient>
      </defs>

      <rect x="24" y="8" width="592" height="240" rx="12" fill="url(#gpu-pcb)" stroke="#2b3a52" />
      <rect x="36" y="19" width="568" height="218" rx="8" fill="none" stroke="#26364d" strokeDasharray="2 7" opacity="0.7" />

      <g stroke="#2b4468" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.9">
        <path d="M56 42 H186 L214 70 H330" />
        <path d="M56 58 H200 L228 86 H330" />
        <path d="M56 198 H150 L176 172 H300" />
        <path d="M470 42 H584" />
        <path d="M452 58 H584" />
        <path d="M462 198 H584" />
        <path d="M404 116 H566" />
        <path d="M74 116 H150" />
      </g>
      <g fill="#33527a">
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={74 + i * 16} cy={120} r="2.2" />
        ))}
      </g>

      <g fill="#2c3a50" stroke="#3f5069" strokeWidth="0.8">
        <rect x="470" y="86" width="26" height="18" rx="2" />
        <rect x="470" y="112" width="26" height="18" rx="2" />
        <rect x="470" y="138" width="26" height="18" rx="2" />
        <rect x="438" y="86" width="18" height="22" rx="2" />
        <rect x="438" y="118" width="18" height="22" rx="2" />
      </g>

      <g fill="#8d99ad" opacity="0.75">
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={120 + i * 34} y={206} width="22" height="8" rx="2" />
        ))}
      </g>

      <rect x="146" y="238" width="214" height="14" rx="3" fill="#0a101c" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={152 + i * 17} y={241} width="12" height="9" rx="1.5" fill="url(#gpu-gold)" />
      ))}

      <rect x="8" y="16" width="20" height="218" rx="4" fill="url(#gpu-plate)" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="12" y={38 + i * 64} width="12" height="46" rx="3" fill="#262f3d" opacity="0.6" />
      ))}

      <g fill="#202b3d" stroke="#4a5a74" strokeWidth="0.8">
        <circle cx="46" cy="34" r="6" />
        <circle cx="594" cy="34" r="6" />
        <circle cx="46" cy="222" r="6" />
        <circle cx="594" cy="222" r="6" />
      </g>
    </svg>
  );
}

function SiliconLayer() {
  return (
    <svg viewBox="0 0 640 256" aria-hidden="true">
      <defs>
        <linearGradient id="gpu-die" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d7e0ee" />
          <stop offset="0.45" stopColor="#b3bfd2" />
          <stop offset="1" stopColor="#8e9bb0" />
        </linearGradient>
      </defs>

      <rect x="238" y="70" width="164" height="118" rx="6" fill="#0c1320" stroke="#1d2a3d" />

      <g fill="#232c3e" stroke="#3a475e" strokeWidth="0.9">
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i} transform={`translate(${252 + i * 20} 16)`}>
            <rect width="17" height="30" rx="3" />
            <rect x="3" y="5" width="11" height="20" rx="2" fill="#2f3b51" />
            <rect x="3" y="5" width="11" height="2" rx="1" fill="#8f9bb0" opacity="0.7" />
          </g>
        ))}
      </g>

      <rect x="270" y="88" width="100" height="92" rx="3" fill="url(#gpu-die)" stroke="#cbd6e6" />
      <rect x="276" y="94" width="88" height="80" rx="2" fill="none" stroke="#96a4ba" opacity="0.55" />
      <text x="320" y="138" textAnchor="middle" fontSize="11" fill="#5f6d84" letterSpacing="1.6">
        AD102
      </text>

      <g fill="#26314a">
        <rect x="244" y="196" width="16" height="16" rx="2" />
        <rect x="380" y="196" width="16" height="16" rx="2" />
        <rect x="244" y="46" width="16" height="16" rx="2" />
        <rect x="380" y="46" width="16" height="16" rx="2" />
      </g>
    </svg>
  );
}

function VramLayer() {
  return (
    <svg viewBox="0 0 640 256" aria-hidden="true">
      <defs>
        <linearGradient id="gpu-chip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a5872" />
          <stop offset="1" stopColor="#323d52" />
        </linearGradient>
      </defs>
      {[62, 106, 150, 194].map((y) => (
        <g key={`l-${y}`}>
          <rect x="188" y={y} width="48" height="30" rx="3" fill="url(#gpu-chip)" stroke="#63728e" />
          <rect x="194" y={y + 6} width="36" height="2" rx="1" fill="#a3b0c6" opacity="0.7" />
          <circle cx="230" cy={y + 7} r="2" fill="#8b98ae" />
          <rect x="404" y={y} width="48" height="30" rx="3" fill="url(#gpu-chip)" stroke="#63728e" />
          <rect x="410" y={y + 6} width="36" height="2" rx="1" fill="#a3b0c6" opacity="0.7" />
          <circle cx="446" cy={y + 7} r="2" fill="#8b98ae" />
        </g>
      ))}
    </svg>
  );
}

function CoolingLayer() {
  return (
    <svg viewBox="0 0 640 256" aria-hidden="true">
      <defs>
        <linearGradient id="gpu-nickel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d3e2" />
          <stop offset="0.5" stopColor="#a2aec1" />
          <stop offset="1" stopColor="#7d8899" />
        </linearGradient>
        <linearGradient id="gpu-copper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c69468" />
          <stop offset="0.5" stopColor="#a9764d" />
          <stop offset="1" stopColor="#8a5c38" />
        </linearGradient>
        <linearGradient id="gpu-pipe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d3dceb" />
          <stop offset="0.5" stopColor="#98a4b8" />
          <stop offset="1" stopColor="#6f7a8c" />
        </linearGradient>
        <pattern id="gpu-fin" width="7" height="12" patternUnits="userSpaceOnUse">
          <rect width="7" height="12" fill="#59647a" />
          <rect width="3.4" height="12" fill="#c4cedc" />
          <rect x="3.4" width="0.9" height="12" fill="#4a5468" />
        </pattern>
      </defs>

      <rect x="56" y="44" width="528" height="168" rx="10" fill="url(#gpu-nickel)" stroke="#8793a7" />

      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="70" y={104 + i * 26} width="500" height="8" rx="4" fill="url(#gpu-pipe)" />
      ))}

      <rect x="70" y="58" width="160" height="140" rx="4" fill="url(#gpu-fin)" />
      <rect x="410" y="58" width="160" height="140" rx="4" fill="url(#gpu-fin)" />
      <rect x="70" y="58" width="160" height="140" rx="4" fill="none" stroke="#6d788b" />

      <rect x="252" y="80" width="136" height="116" rx="5" fill="url(#gpu-copper)" stroke="#8a5f3d" />
      <rect x="262" y="90" width="116" height="96" rx="3" fill="none" stroke="#d9b08a" opacity="0.4" />

      <g fill="#3f4a5c">
        <circle cx="76" cy="52" r="5" />
        <circle cx="564" cy="52" r="5" />
        <circle cx="76" cy="204" r="5" />
        <circle cx="564" cy="204" r="5" />
      </g>
    </svg>
  );
}

function ShroudLayer() {
  return (
    <svg viewBox="0 0 640 256" aria-hidden="true">
      <defs>
        <linearGradient id="gpu-shroud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b3445" />
          <stop offset="0.5" stopColor="#212836" />
          <stop offset="1" stopColor="#171d28" />
        </linearGradient>
        <radialGradient id="gpu-fan-face" cx="50%" cy="40%">
          <stop offset="0" stopColor="#333e53" />
          <stop offset="1" stopColor="#1b2231" />
        </radialGradient>
        <linearGradient id="gpu-blade" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#4a5670" />
          <stop offset="0.55" stopColor="#39445a" />
          <stop offset="1" stopColor="#262f42" />
        </linearGradient>
        <linearGradient id="gpu-hub" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7d8aa1" />
          <stop offset="0.5" stopColor="#59657c" />
          <stop offset="1" stopColor="#3a4457" />
        </linearGradient>
        <mask id="gpu-shroud-mask">
          <rect width="640" height="256" fill="#fff" />
          <circle cx="190" cy="128" r="101" fill="#000" />
          <circle cx="450" cy="128" r="101" fill="#000" />
        </mask>
      </defs>

      <Fan cx="190" cy="128" />
      <Fan cx="450" cy="128" rotation="14" />

      <rect x="20" y="8" width="600" height="240" rx="20" fill="url(#gpu-shroud)" mask="url(#gpu-shroud-mask)" />
      <rect
        x="20"
        y="8"
        width="600"
        height="240"
        rx="20"
        fill="none"
        stroke="#3a4458"
        mask="url(#gpu-shroud-mask)"
      />

      <path d="M104 26 H330" stroke="#39445a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M330 230 H536" stroke="#39445a" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="286" y="22" width="68" height="3" rx="1.5" fill="#004ac6" opacity="0.9" />

      <g fill="#2a3244" stroke="#404b60" strokeWidth="0.9">
        <circle cx="44" cy="32" r="7" />
        <circle cx="596" cy="32" r="7" />
        <circle cx="44" cy="224" r="7" />
        <circle cx="596" cy="224" r="7" />
      </g>
    </svg>
  );
}

const LAYERS = [
  { key: 'pcb', Art: BoardLayer, edge: 'board' },
  { key: 'die', Art: SiliconLayer, edge: 'silicon' },
  { key: 'vram', Art: VramLayer, edge: 'vram' },
  { key: 'cooling', Art: CoolingLayer, edge: 'cooling' },
  { key: 'fans', Art: ShroudLayer, edge: 'shroud' },
];

export default function GpuAnatomy() {
  const { t } = useLanguage();
  const sectionRef = useRef(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const animated = isDesktop && !reduceMotion;

  useScrollProgress(sectionRef, animated);

  return (
    <section
      ref={sectionRef}
      className={`gpu-anatomy ${animated ? 'gpu-anatomy--pinned' : 'gpu-anatomy--static'}`}
      aria-labelledby="gpu-anatomy-title"
    >
      <div className="gpu-anatomy__sticky">
        <div className="gpu-anatomy__inner">
          <div className="gpu-anatomy__copy">
            <h2
              id="gpu-anatomy-title"
              className="font-display text-3xl font-semibold leading-[1.4] text-white lg:text-4xl"
            >
              {t('home.anatomy.title')}
            </h2>
            <p className="mt-4 max-w-md text-base leading-[1.75] text-white/65">
              {t('home.anatomy.lede')}
            </p>
          </div>

          <dl className="gpu-anatomy__legend">
            {PARTS.map((part, index) => (
              <div key={part.id} className={`gpu-legend gpu-k${index + 1}`}>
                <dt className="gpu-legend__term">
                  <span className="gpu-legend__num">{String(index + 1).padStart(2, '0')}</span>
                  <span>{t(part.titleKey)}</span>
                </dt>
                <dd className="gpu-legend__body">{t(part.bodyKey)}</dd>
              </div>
            ))}
          </dl>

          <div className="gpu-anatomy__stage">
            <div className="gpu-scene">
              <div className="gpu-stack" aria-hidden="true">
                {LAYERS.map(({ key, Art, edge }, index) => (
                  <div key={key} className={`gpu-layer gpu-layer--${edge} gpu-k${index + 1}`}>
                    <div className="gpu-plane">
                      <Art />
                    </div>
                    <div className="gpu-edge" />
                    <span className="gpu-badge">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="gpu-hint">
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              {t('home.anatomy.hint')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
