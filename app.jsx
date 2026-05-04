// app.jsx — Marios Pafitis personal site
const { useEffect, useRef, useState } = React;

/* Reveal-on-scroll hook */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal, .r-words");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* Word-staggered text. Accepts a plain string only. */
function WordReveal({ text, className = "", as: Tag = "span", stagger = 40, baseDelay = 0, italic = false }) {
  const words = String(text).split(" ");
  return (
    <Tag className={`r-words ${className}`}>
      {words.map((w, i) => (
        <span
          key={i}
          className={`w${italic ? " it" : ""}`}
          style={{ transitionDelay: `${baseDelay + i * stagger}ms` }}
          dangerouslySetInnerHTML={{ __html: w + (i < words.length - 1 ? "&nbsp;" : "") }}
        />
      ))}
    </Tag>
  );
}

/* Custom cursor */
function Cursor() {
  const ref = useRef(null);
  const dotRef = useRef(null);
  useEffect(() => {
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let dx = x, dy = y;
    let raf;
    const move = (e) => { x = e.clientX; y = e.clientY; };
    const tick = () => {
      dx += (x - dx) * 0.18;
      dy += (y - dy) * 0.18;
      if (ref.current) ref.current.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      if (dotRef.current) dotRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    const enter = () => ref.current && ref.current.classList.add("hover");
    const leave = () => ref.current && ref.current.classList.remove("hover");
    window.addEventListener("mousemove", move);
    document.querySelectorAll("a, button, .venture, .craft-list .item, .cred, .speaking-list .ev").forEach(el => {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", move); };
  }, []);
  return (
    <>
      <div ref={ref} className="cursor"></div>
      <div ref={dotRef} className="cursor dot"></div>
    </>
  );
}

/* Magnetic parallax for the hero portrait */
function useParallax(ref, strength = 12) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const x = (e.clientX - cx) / cx * strength;
      const y = (e.clientY - cy) / cy * strength;
      el.style.setProperty("--px", x + "px");
      el.style.setProperty("--py", y + "px");
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [ref, strength]);
}

/* Vital strip — ECG ticker, BPM, particles */
function Vitals() {
  const [bpm, setBpm] = useState(72);
  useEffect(() => {
    const t = setInterval(() => {
      setBpm(70 + Math.round(Math.sin(Date.now() / 4000) * 3 + Math.random() * 2));
    }, 1200);
    return () => clearInterval(t);
  }, []);
  // ECG: a repeating QRS-like polyline scrolling left
  const ref = useRef(null);
  useEffect(() => {
    let off = 0;
    let raf;
    const draw = () => {
      off = (off + 1.4) % 140;
      if (ref.current) {
        // Build a path that's two repeats so it loops seamlessly
        const seg = (x0) => `M ${x0} 11 L ${x0 + 12} 11 L ${x0 + 18} 11 L ${x0 + 22} 4 L ${x0 + 26} 18 L ${x0 + 30} 6 L ${x0 + 34} 11 L ${x0 + 58} 11 L ${x0 + 62} 9 L ${x0 + 66} 13 L ${x0 + 70} 11 L ${x0 + 140} 11`;
        ref.current.setAttribute("d", seg(-off) + " " + seg(140 - off));
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="vital" aria-hidden="true">
      <span>Live</span>
      <svg className="ecg" viewBox="0 0 140 22" preserveAspectRatio="none">
        <path ref={ref} d="" />
      </svg>
      <span className="bpm"><em>{bpm}</em> bpm</span>
    </div>
  );
}

/* Floating particles */
function Particles({ count = 14 }) {
  const items = Array.from({ length: count }).map((_, i) => {
    const left = Math.random() * 100;
    const dur = 14 + Math.random() * 18;
    const delay = -Math.random() * dur;
    const size = 1 + Math.random() * 2;
    return (
      <span key={i} style={{
        left: left + "%",
        width: size + "px", height: size + "px",
        animationDuration: dur + "s",
        animationDelay: delay + "s",
        opacity: 0.4 + Math.random() * 0.5,
      }} />
    );
  });
  return <div className="particles">{items}</div>;
}

/* Scroll progress bar */
function ScrollProgress() {
  const ref = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const p = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      if (ref.current) ref.current.style.setProperty("--p", p + "%");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div className="scroll-progress" ref={ref}></div>;
}

/* Ripple-on-hover wrapper. Splits text into per-character spans and triggers a wave of bobs. */
function RippleText({ children, className = "", as: Tag = "span" }) {
  const ref = useRef(null);
  // Flatten children to a string. Accept strings, numbers, and react elements with string children.
  const flatten = (n) => {
    if (n == null || typeof n === "boolean") return "";
    if (typeof n === "string" || typeof n === "number") return String(n);
    if (Array.isArray(n)) return n.map(flatten).join("");
    if (n.props && n.props.children !== undefined) return flatten(n.props.children);
    return "";
  };
  const text = flatten(children);
  const onEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fromLeft = e.clientX < rect.left + rect.width / 2;
    const chars = ref.current?.querySelectorAll(".rch") || [];
    chars.forEach((c, i) => {
      const idx = fromLeft ? i : (chars.length - 1 - i);
      c.style.animationDelay = (idx * 28) + "ms";
      c.classList.remove("r-active");
      void c.offsetWidth;
      c.classList.add("r-active");
    });
    setTimeout(() => chars.forEach((c) => c.classList.remove("r-active")), 1200);
  };
  return (
    <Tag ref={ref} className={`ripple-text ${className}`} onMouseEnter={onEnter}>
      {text.split("").map((ch, i) => (
        <span key={i} className="rch" style={{ whiteSpace: ch === " " ? "pre" : "normal" }}>{ch}</span>
      ))}
    </Tag>
  );
}

/* Nav */
function Nav({ bpm }) {
  const ref = useRef(null);
  useEffect(() => {
    let off = 0;
    let raf;
    const draw = () => {
      off = (off + 1.2) % 70;
      if (ref.current) {
        const seg = (x0) => `M ${x0} 8 L ${x0 + 6} 8 L ${x0 + 9} 8 L ${x0 + 11} 3 L ${x0 + 13} 13 L ${x0 + 15} 4 L ${x0 + 17} 8 L ${x0 + 29} 8 L ${x0 + 31} 7 L ${x0 + 33} 9 L ${x0 + 35} 8 L ${x0 + 70} 8`;
        ref.current.setAttribute("d", seg(-off) + " " + seg(70 - off));
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <nav className="nav">
      <div className="nav-mark">
        <span>Marios&nbsp;Pafitis</span>
        <span className="nm-vital" aria-hidden="true">
          <span className="nm-dot"></span>
          <svg className="nm-ecg" viewBox="0 0 70 16" preserveAspectRatio="none">
            <path ref={ref} d="" />
          </svg>
          <span className="nm-bpm"><em>{bpm}</em> bpm</span>
        </span>
      </div>
      <div className="nav-links">
        <a href="#story">Story</a>
        <a href="#mammocheck">MammoCheck</a>
        <a href="#ventures">Ventures</a>
        <a href="#research">Research</a>
        <a href="#contact">Contact</a>
      </div>
    </nav>
  );
}

/* Hero */
function Hero() {
  const bgRef = useRef(null);
  useParallax(bgRef, 18);
  return (
    <header className="hero" id="top">
      <div className="hero-bg" ref={bgRef} style={{ transform: "translate(var(--px,0), var(--py,0))" }}>
        <img src="assets/portrait.jpg" alt="" aria-hidden="true" />
      </div>
      <div className="hero-noise"></div>
      <Particles count={18} />

      <div className="wrap hero-inner">
        <div className="hero-meta reveal">
          <span className="eyebrow"><span className="dot"></span>Co-Founder &amp; CTO, MammoCheck · 2026</span>
          <span className="loc">Nicosia · 35.17°N · 33.36°E</span>
        </div>

        <ForbesBadge />

        <div className="hero-headline">
          <h1>
            <WordReveal text="Building AI" />
            <br />
            <WordReveal text="for problems" baseDelay={140} />
            <br />
            <WordReveal text="worth solving." baseDelay={300} italic={true} />
          </h1>
          <p className="hero-sub reveal d2">
            Cypriot computer scientist and founder.<br /><em>Co-Founder &amp; CTO of MammoCheck</em><br /> — turning research into products for human health and societal impact.
          </p>
        </div>

        <div className="hero-tickers reveal d4">
          <div className="tick">
            <div className="tick-k">Current</div>
            <div className="tick-v">Co-Founder &amp; <em>CTO</em></div>
          </div>
          <div className="tick">
            <div className="tick-k">Building</div>
            <div className="tick-v">At-home <em>screening</em></div>
          </div>
          <div className="tick">
            <div className="tick-k">Clinical Trials</div>
            <div className="tick-v">Active in <em>hospitals</em></div>
          </div>
          <div className="tick">
            <div className="tick-k">Recognition</div>
            <div className="tick-v">Forbes <em>30/30</em></div>
          </div>
        </div>
      </div>

      <div className="scroll-cue">
        <span>Scroll</span>
        <div className="line"></div>
      </div>
    </header>
  );
}

/* Forbes badge — official logo */
function ForbesBadge() {
  const DUR = 6;
  const sparks = Array.from({ length: 8 }).map((_, i) => ({
    angle: (i / 8) * 360,
    dist: 60 + (i % 3) * 14,
    dur: DUR + (i % 3) * 0.8,
    delay: -(i / 8) * DUR,
    size: 2 + (i % 2),
  }));
  return (
    <a
      href="https://www.forbesgreece.gr/forbes-30-under-30-2026/3955090/h-mammocheck-kainotomei-sti-maxi-kata-tou-karkinou-tou-mastou?_gl=1*13mrras*_ga*MTM4NTg3MjQyMy4xNzc3ODgwODQ3*_ga_KWY82MK1WH*czE3Nzc4ODA4NDYkbzEkZzAkdDE3Nzc4ODA4NDYkajYwJGwwJGgw"
      target="_blank"
      rel="noopener"
      className="forbes-badge reveal d3"
    >
      <div className="forbes-aura">
        {sparks.map((s, i) => (
          <span key={i} className="forbes-spark" style={{
            "--angle": s.angle + "deg",
            "--dist": s.dist + "px",
            width: s.size + "px",
            height: s.size + "px",
            animationDuration: s.dur + "s",
            animationDelay: s.delay + "s",
          }} />
        ))}
        <img src="assets/30-under-30-1-removebg-preview.png" alt="Forbes 30 Under 30 · Greek List 2026" className="forbes-logo" />
      </div>
    </a>
  );
  /* Seal commented out — replaced with official logo
  return (
    <div className="forbes-badge reveal d3">
      <div className="seal">
        <svg className="seal-rim" viewBox="0 0 200 200">
          <defs>
            <path id="rim-path" d="M 8,100 a 92,92 0 0,0 184,0" />
          </defs>
        </svg>
        <div className="seal-inner">
          <div className="num">30/30</div>
          <div className="lbl">Greek List</div>
        </div>
      </div>
      <div className="meta">Forbes 30 Under 30<br />Greek List 2026</div>
    </div>
  );
  */
}

/* Story */
function Story() {
  return (
    <section className="chapter" id="story">
      <div className="wrap">
        <div className="chapter-head reveal">
          <div className="chapter-no"><span className="num">i.</span><RippleText>The Story</RippleText></div>
          <h2 className="chapter-title">A path with <em>one thesis:</em><br />research, shipped.</h2>
        </div>

        <div className="story-body">
          <div className="lede reveal">Origin · 1998 · Cyprus</div>
          <div>
            <p className="reveal">
              As an undergraduate, Marios researched the early diagnosis of <em>Alzheimer's disease</em> using deep learning on MRI brain scans — work later published in <strong>IEEE Access (2024)</strong>.
            </p>
            <p className="reveal d1">
              He co-founded <em>Fooderloo</em> to fight food waste, scaling it across Cyprus and earning recognition from the World Summit Awards and Mission Innovation.
            </p>
            <p className="reveal d2">
              Selected as a <em>U.S. Department of State YTILI Fellow</em> (Fall 2024), he represented Cyprus across San Francisco, Silicon Valley, Pittsburgh, Denver, Washington D.C., and New York — engaging investors, founders, and industry leaders.
            </p>
            <p className="reveal d3">
              Today, as Co-Founder &amp; CTO of <em>MammoCheck</em>, he leads the engineering and AI behind an at-home breast cancer screening device — currently in clinical trials across hospitals in Cyprus, with a regulatory path toward FDA 510(k) and CE MDR Class IIa.
            </p>
          </div>
        </div>

        <div className="story-pattern reveal">
          <strong>The pattern.</strong> Identify a problem that affects people's lives. Build with the rigor to actually move the needle. Ship it.
        </div>
      </div>
    </section>
  );
}

/* MammoCheck */
function MammoCheck() {
  const creds = [
    { y: "2025", t: "LifeX Medical Device Accelerator", s: "Pittsburgh, PA" },
    { y: "2025", t: "IDEA Bank of Cyprus Accelerator", s: "10th Cycle" },
    { y: "2024–25", t: "EGG Accelerator", s: "#1 in Greece · 12th Cycle" },
    { y: "2022–24", t: "Cyprus Seeds graduate", s: "3rd Cycle" },
    { y: "2025", t: "1st place, CyEC", s: "Cyprus Entrepreneurship Competition" },
    { y: "2023", t: "1st place, Startups4Peace", s: "International recognition" },
    { y: "2023", t: "Rising Star Award", s: "Digital Agenda Alpha Stage AI" },
    { y: "2023", t: "Microsoft for Startups", s: "Founders Hub · Cyprus Program" },
  ];
  return (
    <section className="mc" id="mammocheck">
      <div className="mc-inner">
        <div className="chapter-head reveal">
          <div className="chapter-no"><span className="num">ii.</span><RippleText>Current Chapter</RippleText></div>
          <h2 className="chapter-title"><a href="https://mammocheck.co" target="_blank" rel="noopener">MammoCheck</a> — <em>at-home screening,</em><br />between mammograms.</h2>
        </div>

        <div className="mc-grid">
          <div>
            <p className="mc-lede reveal">
              An <em>AI-powered thermal imaging platform</em> for at-home breast cancer screening — affordable, painless, accessible. Built with the rigor of a medical device, designed for the privacy of a home.
            </p>

            <div className="mc-meta reveal d1">
              <div>
                <div className="k">Clinical Trial</div>
                <div className="v">Active across hospitals in Cyprus.</div>
              </div>
              <div>
                <div className="k">Regulatory Path</div>
                <div className="v">FDA & CE MDR</div>
              </div>
              <div>
                <div className="k">Recognition</div>
                <div className="v">Cyprus Innovative Enterprise Certificate</div>
              </div>
              <div>
                <div className="k">Role</div>
                <div className="v">Co-Founder &amp; Chief Technology Officer</div>
              </div>
            </div>
          </div>

          <div className="mc-device reveal d2">
            <div className="top-label">REC · THERMAL · 28°C–38°C</div>
            <div className="breast"></div>
            <div className="iso-rings"></div>
            <div className="scanline"></div>
            <div className="corners"><span></span></div>
            <div className="label">MammoCheck</div>
          </div>
        </div>

        <div className="mc-credentials reveal">
          <h4>Accelerators &amp; Awards</h4>
          <div className="mc-creds-grid">
            {creds.map((c, i) => (
              <div className="cred" key={i}>
                <div className="y">{c.y}</div>
                <div className="t">{c.t}</div>
                <div className="s">{c.s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Marquee */
function Marquee() {
  const items = [
    "Health is the work",
    "Research becomes product",
    "Cyprus → Pittsburgh → World",
    "Ship the thing that moves the needle",
    "Quiet rigor over loud claims",
  ];
  const row = (
    <span>
      {items.map((t, i) => (
        <React.Fragment key={i}>
          {t}
          <span className="sep"></span>
        </React.Fragment>
      ))}
    </span>
  );
  return (
    <div className="marquee">
      <div className="marquee-track">
        {row}
        {row}
      </div>
    </div>
  );
}

/* Ventures */
function Ventures() {
  const v = [
    {
      role: "Co-Founder",
      yrs: "2024 — Now",
      name: "Ace & Zeros",
      url: "https://aceandzeros.com",
      desc: "Cyprus-based software development and consulting agency. AI-driven solutions across warehouse management, document intelligence, and digital transformation.",
      tags: ["AI", "Consulting", "Cyprus"],
    },
    {
      role: "Technical Lead",
      yrs: "2024 — Now",
      name: "CYENS Centre of Excellence",
      url: "https://cyens.org.cy",
      desc: "Leads technical strategy for AI and digital transformation projects with €50k–€300k budgets, including the iNicosia Urban Digital Twin platform.",
      tags: ["Public Sector", "Digital Twin", "AI"],
    },
    {
      role: "Co-Founder",
      yrs: "2019 — 2024",
      name: "Fooderloo",
      url: "https://fooderloo.com",
      desc: "Marketplace for near-expiry food. Recognized by the World Summit Awards (Best Innovative Solution in Cyprus), Mission Innovation Champions Top 1000, and Climate Launchpad Top 10 Green Businesses in Cyprus.",
      tags: ["Climate", "Marketplace", "Exit"],
    },
  ];
  return (
    <section className="chapter" id="ventures">
      <div className="wrap">
        <div className="chapter-head reveal">
          <div className="chapter-no"><span className="num">iii.</span><RippleText>Other Ventures</RippleText></div>
          <h2 className="chapter-title">Proof points — <em>same thesis,</em> different surfaces.</h2>
        </div>

        <div className="ventures">
          {v.map((it, i) => {
            const Tag = it.url ? "a" : "article";
            const props = it.url ? { href: it.url, target: "_blank", rel: "noopener" } : {};
            return (
              <Tag className="venture reveal" style={{ transitionDelay: `${i * 0.08}s` }} key={i} {...props}>
                <div className="v-head">
                  <span className="v-role">{it.role}</span>
                  <span className="v-yrs">{it.yrs}</span>
                </div>
                <h3 className="v-name"><RippleText>{it.name}</RippleText></h3>
                <p className="v-desc">{it.desc}</p>
                <div className="v-tags">
                  {it.tags.map((t, j) => <span className="v-tag" key={j}>{t}</span>)}
                </div>
                <span className="v-arrow">→</span>
              </Tag>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* Recognition + Speaking */
function Recognition() {
  const left = [
    { y: "2026", t: <><a href="https://www.forbesgreece.gr/forbes-30-under-30-2026/3955090/h-mammocheck-kainotomei-sti-maxi-kata-tou-karkinou-tou-mastou?_gl=1*13mrras*_ga*MTM4NTg3MjQyMy4xNzc3ODgwODQ3*_ga_KWY82MK1WH*czE3Nzc4ODA4NDYkbzEkZzAkdDE3Nzc4ODA4NDYkajYwJGwwJGgw" target="_blank" rel="noopener" className="forbes-inline"><span className="f-mark">F</span><span className="f-txt">Forbes <em>30 Under 30</em></span></a> Greek List</>, s: "List of 2026" },
    { y: "2024", t: <>U.S. Department of State <em>YTILI Fellow</em></>, s: "Pittsburgh placement" },
    { y: "2025–27", t: "YTILI Alumni Board Member", s: "" },
    { y: "2025", t: "Startup World Cup Mentor", s: "" },
    { y: "2025", t: "Young Innovation & Entrepreneurship Award", s: "Research category" },
  ];
  const right = [
    { y: "2022", t: "Michael Frederickou Award", s: "Outstanding Student or Graduate" },
    { y: "2021", t: "100% scholarship, MSc Web & Smart Systems", s: "Frederick University of Cyprus" },
    { y: "2021", t: "1st place, StudentLife Awards", s: "Most Active University Student" },
    { y: "2021–", t: "Reviewer, Neural Computing & Applications", s: "Springer · ongoing" },
  ];
  const speaking = [
    { ev: "SLUSH", yr: "'23, '24", loc: "Helsinki" },
    { ev: "WebSummit", yr: "'23 Lisbon, '24 Doha" },
    { ev: "EU-Startups Summit", yr: "'23", loc: "Barcelona" },
    { ev: "Athenian Nexus SFF Summit", yr: "'24" },
    { ev: "Gen-E", yr: "'23", loc: "Istanbul" },
    { ev: "AmCham EU Youth Awards", yr: "'23", loc: "Brussels" },
    { ev: "MIT 25th Global Startup Workshop", yr: "'23", loc: "Athens" },
  ];
  return (
    <section className="chapter" id="recognition">
      <div className="wrap">
        <div className="chapter-head reveal">
          <div className="chapter-no"><span className="num">iv.</span><RippleText>Recognition</RippleText></div>
          <h2 className="chapter-title">Quiet credibility — <em>not the headline.</em></h2>
        </div>

        <div className="recog-grid">
          <div className="recog reveal">
            <h3>Fellowships & Honors</h3>
            <ul>
              {left.map((it, i) => (
                <li key={i}>
                  <span className="yr">{it.y}</span>
                  <span className="it">{it.t}{it.s && <small>{it.s}</small>}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="recog reveal d1">
            <h3>Academic & Other</h3>
            <ul>
              {right.map((it, i) => (
                <li key={i}>
                  <span className="yr">{it.y}</span>
                  <span className="it">{it.t}{it.s && <small>{it.s}</small>}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="speaking reveal">
          <h3>Speaking & Events</h3>
          <div className="speaking-list">
            {speaking.map((s, i) => (
              <React.Fragment key={i}>
                <span className="ev"><em>{s.ev}</em>{s.loc && `, ${s.loc}`}<span className="yr">{s.yr}</span></span>
                {i < speaking.length - 1 && <span className="sep">·</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Research */
function Research() {
  return (
    <section className="chapter" id="research" style={{ background: "var(--paper)" }}>
      <div className="wrap">
        <div className="chapter-head reveal">
          <div className="chapter-no"><span className="num">v.</span><RippleText>Selected Research</RippleText></div>
          <h2 className="chapter-title">Where the work <em>begins —</em><br />peer-reviewed.</h2>
        </div>

        <ol className="research-list">
          <li className="reveal">
            <div className="cite">
              <span className="authors">Pafitis, M., Constantinou, C., Christodoulou, C.</span>
              {" "}
              <a href="https://ieeexplore.ieee.org/stamp/stamp.jsp?arnumber=10736607" target="_blank" rel="noopener"><em>Accelerating training of convolutional neural networks with Hessian-free optimization for detecting Alzheimer's disease in brain MRI.</em></a>
              <span className="venue">IEEE Access · 2024</span>
            </div>
          </li>
          <li className="reveal d1">
            <div className="cite">
              <span className="authors">Pafitis, M., et al.</span>
              {" "}
              <a href="https://www.researchgate.net/publication/374531415_MELETI_A_Machine-Learning-Based_Embedded_System_Architecture_for_Infrastructure_Inspection_with_UAVs" target="_blank" rel="noopener"><em>MELETI: A Machine-Learning-Based Embedded System Architecture for Infrastructure Inspection with UAVs.</em></a>
              <span className="venue">Embedded Machine Learning for Cyber-Physical, IoT, and Edge Computing · 2023</span>
            </div>
          </li>
          <li className="reveal d2">
            <div className="cite">
              <span className="authors">Service</span>
              {" "}
              <em>Reviewer, Neural Computing and Applications.</em>
              <span className="venue">Springer · ongoing</span>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}

/* Education + Craft */
function EduCraft() {
  return (
    <section className="chapter" id="education">
      <div className="wrap">
        <div className="chapter-head reveal">
          <div className="chapter-no"><span className="num">vi.</span>Education &amp; Craft</div>
          <h2 className="chapter-title">Trained at <em>the bench,</em> sharpened in the field.</h2>
        </div>

        <div className="split">
          <div className="col reveal">
            <h3>Education</h3>
            <div className="edu-item">
              <div className="deg">MSc Web &amp; Smart Systems</div>
              <div className="inst">Frederick University of Cyprus</div>
              <span className="stat">10/10 · 1st of class · 100% scholarship</span>
            </div>
            <div className="edu-item">
              <div className="deg">BSc Computer Science (AI Specialty)</div>
              <div className="inst">University of Cyprus</div>
              <span className="stat">9.31/10 · 1st class honours · 4th of class</span>
            </div>
            <div className="edu-item">
              <div className="deg">Erasmus+ exchange</div>
              <div className="inst">Brno University of Technology, Czech Republic</div>
            </div>
          </div>

          <div className="col reveal d1">
            <h3>Craft</h3>
            <div className="craft-list">
              {["TypeScript", "PHP", "Python", "Java", "C", "React", "Angular", "Vue.js", "Node", "Laravel", "Django", "Flutter", "Machine Learning", "Computer Vision", "Docker", "LLMs & RAG"].map((t, i) => (
                <span className="item" key={i}>{t}</span>
              ))}
            </div>
            <div className="lang">
              <strong>Languages.</strong> Greek (native) · English (IELTS 8.5)
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Human note */
function HumanNote() {
  return (
    <section className="note" id="note">
      <div className="wrap">
        <div className="note-inner">
          <div>
            <div className="eyebrow">A more human note</div>
            <h4>Before the labs <em>and the trials,</em> there were games.</h4>
          </div>
          <p>
            Independent game developer, 2013–2019. Released four titles, including <em>Chess Shooter</em> (2019). The same instinct is still here — make a thing, ship it, see what happens. Find them at <a href="https://mariospafitis.itch.io" target="_blank" rel="noopener">mariospafitis.itch.io</a>.
          </p>
        </div>
      </div>
    </section>
  );
}

/* Contact */
function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="wrap">
        <h2 className="reveal">
          Let's build something <em>worth building.</em><span className="small"> ¶</span>
        </h2>

        <div className="contact-grid">
          <div className="reveal">
            <div className="c-k">LinkedIn</div>
            <a className="c-v" href="https://linkedin.com/in/marios-pafitis" target="_blank" rel="noopener">Reach me on LinkedIn</a>
          </div>
          <div className="reveal d1">
            <div className="c-k">GitHub</div>
            <a className="c-v" href="https://github.com/mpafit02" target="_blank" rel="noopener">mpafit02</a>
          </div>
          <div className="reveal d2">
            <div className="c-k">Email</div>
            <a className="c-v" href="mailto:mariospafitis1998@gmail.com">mariospafitis1998@gmail.com</a>
          </div>
          <div className="reveal d3">
            <div className="c-k">Located</div>
            <span className="c-v">Nicosia, Cyprus</span>
          </div>
        </div>

        <div className="foot">
          <span><a href="https://linkedin.com/in/marios-pafitis" target="_blank" rel="noopener">LinkedIn</a> · <a href="https://github.com/mpafit02" target="_blank" rel="noopener">GitHub</a></span>
          <span>© 2026 · Marios Pafitis</span>
        </div>
      </div>
    </section>
  );
}

/* Tweaks panel */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#c0392b",
  "headline": "fraunces",
  "density": "regular",
  "showMarquee": true
}/*EDITMODE-END*/;

const ACCENT_PRESETS = {
  "signal red": "#c0392b",
  "bordeaux": "#7a1c2a",
  "oxblood": "#5a1018",
  "crimson": "#a01b2a",
  "rust": "#b04a2a",
};
const HEADLINE_FONTS = {
  fraunces: '"Fraunces", "Source Serif Pro", Georgia, serif',
  tiempos: '"Newsreader", "Source Serif Pro", Georgia, serif',
  sans: '"Inter Tight", "Inter", -apple-system, sans-serif',
};

function App() {
  useReveal();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [bpm, setBpm] = useState(72);
  useEffect(() => {
    const iv = setInterval(() => {
      setBpm(70 + Math.round(Math.sin(Date.now() / 4000) * 3 + Math.random() * 2));
    }, 1200);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--accent", t.accent);
    r.setProperty("--serif", HEADLINE_FONTS[t.headline] || HEADLINE_FONTS.fraunces);
    document.body.style.fontSize = t.density === "compact" ? "16px" : t.density === "comfy" ? "18px" : "17px";
  }, [t]);

  return (
    <>
      <Cursor />
      <ScrollProgress />
      <Vitals />
      <Nav bpm={bpm} />
      <Hero />
      <Story />
      <MammoCheck />
      {t.showMarquee && <Marquee />}
      <Ventures />
      <Recognition />
      <Research />
      <EduCraft />
      <HumanNote />
      <Contact />

      <TweaksPanel>
        <TweakSection label="Accent" />
        <TweakColor
          label="Accent color"
          value={t.accent}
          onChange={(v) => setTweak("accent", v)}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(ACCENT_PRESETS).map(([name, hex]) => (
            <button
              key={hex}
              onClick={() => setTweak("accent", hex)}
              title={name}
              style={{
                width: 22, height: 22, borderRadius: 6,
                background: hex,
                border: t.accent.toLowerCase() === hex ? "2px solid #f5ebe3" : "0.5px solid rgba(255,255,255,0.2)",
                cursor: "pointer", padding: 0,
              }}
            />
          ))}
        </div>
        <TweakSection label="Typography" />
        <TweakSelect
          label="Headline font"
          value={t.headline}
          options={[
            { value: "fraunces", label: "Fraunces (serif)" },
            { value: "tiempos", label: "Newsreader (serif)" },
            { value: "sans", label: "Inter Tight (sans)" },
          ]}
          onChange={(v) => setTweak("headline", v)}
        />
        <TweakRadio
          label="Density"
          value={t.density}
          options={["compact", "regular", "comfy"]}
          onChange={(v) => setTweak("density", v)}
        />
        <TweakSection label="Sections" />
        <TweakToggle
          label="Marquee"
          value={t.showMarquee}
          onChange={(v) => setTweak("showMarquee", v)}
        />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
