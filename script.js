/* ============================================
   ROMANTIC LOVE LETTER — SCRIPT
   For Mai ♾️
   ============================================ */

// ============================================
// 1. AMBIENT PIANO AUDIO ENGINE
// ============================================
class AmbientPiano {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.reverbNode = null;
        this.isPlaying = false;
        this.scheduledTimeout = null;

        // Romantic chord progression: Am → F → C → G → Em → Am
        this.chords = [
            [220.00, 261.63, 329.63],       // Am (A3, C4, E4)
            [174.61, 220.00, 261.63],       // F  (F3, A3, C4)
            [261.63, 329.63, 392.00],       // C  (C4, E4, G4)
            [196.00, 246.94, 293.66],       // G  (G3, B3, D4)
            [164.81, 207.65, 246.94],       // Em (E3, G#3, B3)
            [220.00, 261.63, 329.63],       // Am
        ];

        // Higher octave notes for melodic sparkle
        this.sparkleNotes = [523.25, 587.33, 659.26, 783.99, 880.00];
        this.chordIndex = 0;
    }

    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Reverb
        this.reverbNode = this.createReverb();
        this.reverbNode.connect(this.masterGain);

        // Dry path
        this.dryGain = this.ctx.createGain();
        this.dryGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        this.dryGain.connect(this.masterGain);

        // Wet path
        this.wetGain = this.ctx.createGain();
        this.wetGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.wetGain.connect(this.reverbNode);
    }

    createReverb() {
        const length = this.ctx.sampleRate * 3.5;
        const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);

        for (let ch = 0; ch < 2; ch++) {
            const data = impulse.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, 2.5);
                data[i] = (Math.random() * 2 - 1) * decay * 0.5;
            }
        }

        const convolver = this.ctx.createConvolver();
        convolver.buffer = impulse;
        return convolver;
    }

    playNote(freq, startTime, duration, velocity = 0.12) {
        // Use two oscillators for richer tone
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, startTime);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, startTime); // Octave harmonic
        
        const osc2Gain = this.ctx.createGain();
        osc2Gain.gain.setValueAtTime(velocity * 0.15, startTime);

        // Envelope: soft attack, long release
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(velocity, startTime + 0.08);
        gainNode.gain.setValueAtTime(velocity, startTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc1.connect(gainNode);
        osc2.connect(osc2Gain);
        osc2Gain.connect(gainNode);

        gainNode.connect(this.dryGain);
        gainNode.connect(this.wetGain);

        osc1.start(startTime);
        osc1.stop(startTime + duration);
        osc2.start(startTime);
        osc2.stop(startTime + duration);
    }

    playChord() {
        if (!this.isPlaying) return;

        const now = this.ctx.currentTime;
        const chord = this.chords[this.chordIndex % this.chords.length];

        // Arpeggiate the chord
        chord.forEach((note, i) => {
            this.playNote(note, now + i * 0.35, 4.0, 0.10);
        });

        // Occasional sparkle note
        if (Math.random() > 0.5) {
            const sparkle = this.sparkleNotes[Math.floor(Math.random() * this.sparkleNotes.length)];
            this.playNote(sparkle, now + 1.5, 3.0, 0.04);
        }

        this.chordIndex++;

        // Schedule next chord
        this.scheduledTimeout = setTimeout(() => this.playChord(), 4500 + Math.random() * 2000);
    }

    fadeIn(duration = 4) {
        this.masterGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + duration);
    }

    async start() {
        if (this.isPlaying) return;
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            try {
                await this.ctx.resume();
            } catch (e) {
                console.warn('Audio resume notice', e);
            }
        }
        this.isPlaying = true;
        this.fadeIn();
        this.playChord();
    }

    async resumeAudio() {
        if (this.ctx && this.ctx.state === 'suspended') {
            try {
                await this.ctx.resume();
            } catch (e) {
                // silent
            }
        }
    }

    stop() {
        this.isPlaying = false;
        if (this.scheduledTimeout) clearTimeout(this.scheduledTimeout);
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
        }
    }
}

// ============================================
// 2. GOLDEN PARTICLE SYSTEM
// ============================================
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animId = null;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.resize();
        window.addEventListener('resize', () => this.resize(), { passive: true });
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = Math.floor(this.width * dpr);
        this.canvas.height = Math.floor(this.height * dpr);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
    }

    createParticle() {
        return {
            x: Math.random() * this.width,
            y: this.height + 10,
            size: Math.random() * 2.5 + 0.5,
            speedY: -(Math.random() * 0.6 + 0.15),
            speedX: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.6 + 0.2,
            wobbleSpeed: Math.random() * 0.02 + 0.005,
            wobbleAmount: Math.random() * 30 + 10,
            phase: Math.random() * Math.PI * 2,
            life: 0,
            maxLife: Math.random() * 600 + 400,
        };
    }

    update() {
        // Add new particles
        if (this.particles.length < 80) {
            if (Math.random() > 0.85) {
                this.particles.push(this.createParticle());
            }
        }

        this.ctx.clearRect(0, 0, this.width, this.height);

        this.particles = this.particles.filter(p => {
            p.life++;
            p.y += p.speedY;
            p.x += Math.sin(p.phase + p.life * p.wobbleSpeed) * 0.3;
            
            // Fade in/out
            let alpha = p.opacity;
            if (p.life < 60) alpha *= p.life / 60;
            if (p.life > p.maxLife - 60) alpha *= (p.maxLife - p.life) / 60;

            // Draw glow
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            gradient.addColorStop(0, `rgba(212, 163, 115, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(212, 163, 115, ${alpha * 0.3})`);
            gradient.addColorStop(1, `rgba(212, 163, 115, 0)`);

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Core dot
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 248, 240, ${alpha * 0.8})`;
            this.ctx.fill();

            return p.life < p.maxLife && p.y > -20;
        });

        this.animId = requestAnimationFrame(() => this.update());
    }

    start() {
        this.canvas.classList.add('visible');
        this.update();
    }

    stop() {
        if (this.animId) cancelAnimationFrame(this.animId);
    }
}

// ============================================
// 3. STAR FIELD RENDERER
// ============================================
class StarField {
    constructor(canvas, starCount = 200) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        this.starCount = starCount;
        this.animId = null;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.resize();
        window.addEventListener('resize', () => this.resize(), { passive: true });
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const parent = this.canvas.parentElement;
        this.width = parent ? parent.offsetWidth : window.innerWidth;
        this.height = parent ? parent.offsetHeight : window.innerHeight;
        this.canvas.width = Math.floor(this.width * dpr);
        this.canvas.height = Math.floor(this.height * dpr);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
        this.initStars();
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 1.8 + 0.3,
                twinkleSpeed: Math.random() * 0.03 + 0.01,
                twinklePhase: Math.random() * Math.PI * 2,
                baseOpacity: Math.random() * 0.5 + 0.3,
                speedX: (Math.random() - 0.5) * 0.05,
                speedY: (Math.random() - 0.5) * 0.02,
            });
        }
    }

    render(time) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.stars.forEach(s => {
            s.x += s.speedX;
            s.y += s.speedY;

            if (s.x < 0) s.x = this.width;
            if (s.x > this.width) s.x = 0;
            if (s.y < 0) s.y = this.height;
            if (s.y > this.height) s.y = 0;

            const twinkle = Math.sin(time * s.twinkleSpeed + s.twinklePhase) * 0.5 + 0.5;
            const opacity = s.baseOpacity * (0.5 + twinkle * 0.5);

            // Star glow
            const grad = this.ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 2.5);
            grad.addColorStop(0, `rgba(234, 215, 192, ${opacity})`);
            grad.addColorStop(1, `rgba(234, 215, 192, 0)`);
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size * 2.5, 0, Math.PI * 2);
            this.ctx.fillStyle = grad;
            this.ctx.fill();

            // Star core
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size * 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 248, 240, ${opacity})`;
            this.ctx.fill();
        });

        this.animId = requestAnimationFrame((t) => this.render(t));
    }

    start() {
        this.render(0);
    }

    stop() {
        if (this.animId) cancelAnimationFrame(this.animId);
    }
}

// ============================================
// 4. MAIN APPLICATION
// ============================================
class LoveLetterApp {
    constructor() {
        // Systems
        this.piano = new AmbientPiano();
        this.particles = new ParticleSystem(document.getElementById('particles'));
        this.moonStars = null;
        this.finalStars = null;

        // DOM elements
        this.startOverlay = document.getElementById('start-overlay');
        this.introOverlay = document.getElementById('intro-overlay');
        this.envelopeOverlay = document.getElementById('envelope-overlay');
        this.mainContent = document.getElementById('main-content');
        this.waxSeal = document.getElementById('wax-seal');
        this.envelopeFlap = document.getElementById('envelope-flap');
        this.letterInside = document.getElementById('letter-inside');
        this.envelope = document.getElementById('envelope');
        this.sealHint = document.getElementById('seal-hint');
        this.heartbeatVignette = document.getElementById('heartbeat-vignette');
        this.ambientGlow = document.getElementById('ambient-glow');

        this.heartbeatInterval = null;
        this.init();
    }

    init() {
        // Start on click or touch
        const startHandler = (e) => {
            if (e && e.cancelable && e.type !== 'click') e.preventDefault();
            this.startExperience();
        };

        this.startOverlay.addEventListener('click', startHandler, { once: true });

        // Touch sparkles & dynamic micro-interactions
        this.setupTouchSparkles();

        // Responsive orientation change & resize listener for GSAP ScrollTrigger
        this.setupResponsiveListeners();
    }

    // ---- START EXPERIENCE ----
    startExperience() {
        // Start audio
        this.piano.start();

        // Start particles
        this.particles.start();

        // Show ambient glow
        this.ambientGlow.classList.add('visible');

        // Hide start overlay
        this.startOverlay.classList.add('hidden');
        setTimeout(() => {
            this.startOverlay.style.display = 'none';
        }, 1000);

        // Begin intro animation
        setTimeout(() => this.playIntro(), 800);
    }

    // ---- INTRO ANIMATION ----
    playIntro() {
        const introOverlay = this.introOverlay;
        const introTo = document.getElementById('intro-to');
        const introMessage = document.getElementById('intro-message');

        introOverlay.classList.add('active');

        // GSAP timeline for intro
        const tl = gsap.timeline();

        tl.to(introTo, {
            opacity: 1,
            y: 0,
            duration: 1.8,
            ease: 'power3.out',
        })
        .to(introMessage, {
            opacity: 1,
            y: 0,
            duration: 1.5,
            ease: 'power3.out',
        }, '-=0.6')
        .to({}, { duration: 3 }) // Hold for 3 seconds
        .to([introTo, introMessage], {
            opacity: 0,
            y: -20,
            duration: 1.2,
            ease: 'power2.in',
            stagger: 0.2,
        })
        .call(() => {
            introOverlay.classList.remove('active');
            introOverlay.style.display = 'none';
            this.showEnvelope();
        });
    }

    // ---- ENVELOPE ANIMATION ----
    showEnvelope() {
        const overlay = this.envelopeOverlay;
        overlay.classList.add('active');

        gsap.fromTo(this.envelope, 
            { scale: 0.7, opacity: 0 },
            { 
                scale: 1, 
                opacity: 1, 
                duration: 1.5, 
                ease: 'back.out(1.4)',
            }
        );

        gsap.fromTo(this.sealHint,
            { opacity: 0, y: 10 },
            { opacity: 0.7, y: 0, duration: 1, delay: 1.5 }
        );

        // Seal click handler
        const openHandler = (e) => {
            e.stopPropagation();
            if (this.piano) this.piano.resumeAudio();
            this.openEnvelope();
        };
        this.waxSeal.addEventListener('click', openHandler, { once: true });
    }

    openEnvelope() {
        // Hide hint
        gsap.to(this.sealHint, { opacity: 0, duration: 0.3 });

        // Seal break animation
        const sealTl = gsap.timeline();

        // Create seal shatter particles
        this.createSealParticles();

        sealTl
            .to(this.waxSeal, {
                scale: 1.3,
                duration: 0.2,
                ease: 'power2.out',
            })
            .to(this.waxSeal, {
                scale: 0,
                opacity: 0,
                rotation: 20,
                duration: 0.5,
                ease: 'power3.in',
            });

        // Open flap after seal breaks
        setTimeout(() => {
            this.envelopeFlap.classList.add('open');
        }, 600);

        // Slide letter out
        setTimeout(() => {
            gsap.to(this.letterInside, {
                y: '-70%',
                duration: 1.5,
                ease: 'power2.out',
            });
        }, 1200);

        // Zoom in and transition
        setTimeout(() => {
            gsap.to(this.envelope, {
                scale: 3,
                opacity: 0,
                duration: 1.8,
                ease: 'power2.in',
                onComplete: () => {
                    this.envelopeOverlay.style.display = 'none';
                    this.revealContent();
                }
            });
        }, 2800);
    }

    createSealParticles() {
        const sealRect = this.waxSeal.getBoundingClientRect();
        const cx = sealRect.left + sealRect.width / 2;
        const cy = sealRect.top + sealRect.height / 2;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: ${Math.random() * 8 + 3}px;
                height: ${Math.random() * 8 + 3}px;
                background: ${Math.random() > 0.5 ? '#C0392B' : '#922B21'};
                border-radius: ${Math.random() > 0.3 ? '50%' : '2px'};
                left: ${cx}px;
                top: ${cy}px;
                z-index: 9999;
                pointer-events: none;
            `;
            document.body.appendChild(particle);

            const angle = (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.5;
            const distance = Math.random() * 120 + 40;
            const destX = Math.cos(angle) * distance;
            const destY = Math.sin(angle) * distance;

            gsap.to(particle, {
                x: destX,
                y: destY + 60,
                opacity: 0,
                rotation: Math.random() * 360,
                duration: 1 + Math.random() * 0.5,
                ease: 'power2.out',
                onComplete: () => particle.remove(),
            });
        }
    }

    // ---- REVEAL MAIN CONTENT ----
    revealContent() {
        document.body.classList.add('scrollable');
        window.scrollTo(0, 0);

        // Start heartbeat
        this.startHeartbeat();

        // Setup scroll animations
        this.setupLetterAnimations();
        this.setupTimelineAnimations();
        this.setupMoonAnimations();
        this.setupFinalAnimations();

        // Initialize star fields
        this.moonStars = new StarField(document.getElementById('moon-stars-canvas'), 120);
        this.finalStars = new StarField(document.getElementById('final-stars-canvas'), 250);
        this.moonStars.start();
        this.finalStars.start();
    }

    // ---- LETTER LINE-BY-LINE REVEAL ----
    setupLetterAnimations() {
        const lines = document.querySelectorAll('.letter-line');
        const divider = document.querySelector('.letter-divider');
        const signature = document.querySelector('.letter-signature');
        const paper = document.getElementById('letter-paper');

        // Paper entrance
        gsap.fromTo(paper,
            { opacity: 0, y: 60, rotateZ: -2 },
            {
                opacity: 1,
                y: 0,
                rotateZ: -0.4,
                duration: 1.5,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '#letter-section',
                    start: 'top 90%',
                    toggleActions: 'play none none none',
                }
            }
        );

        // Lines
        lines.forEach((line, i) => {
            gsap.to(line, {
                opacity: 1,
                y: 0,
                duration: 1.2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: line,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                }
            });
        });

        // Divider
        if (divider) {
            gsap.to(divider, {
                opacity: 0.7,
                duration: 1,
                scrollTrigger: {
                    trigger: divider,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                }
            });
        }

        // Signature
        if (signature) {
            gsap.to(signature, {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: signature,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                }
            });
        }
    }

    // ---- TIMELINE ANIMATIONS ----
    setupTimelineAnimations() {
        const title = document.getElementById('timeline-title');
        const items = document.querySelectorAll('.timeline-item');
        const track = document.getElementById('timeline-track');

        // Title
        gsap.to(title, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '#timeline-section',
                start: 'top 75%',
                toggleActions: 'play none none none',
            }
        });

        // Track line grows
        gsap.fromTo(track,
            { scaleY: 0 },
            {
                scaleY: 1,
                duration: 1.5,
                ease: 'power2.out',
                transformOrigin: 'top center',
                scrollTrigger: {
                    trigger: '#timeline-section',
                    start: 'top 70%',
                    toggleActions: 'play none none none',
                }
            }
        );

        // Items
        items.forEach((item, i) => {
            const isOdd = i % 2 === 0; // CSS nth-child is 1-based, items are 0-based after the track
            gsap.to(item, {
                opacity: 1,
                x: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: item,
                    start: 'top 82%',
                    toggleActions: 'play none none none',
                }
            });
        });
    }

    // ---- MOON SECTION ANIMATIONS ----
    setupMoonAnimations() {
        const moon = document.getElementById('moon');
        const lines = document.querySelectorAll('.moon-line');

        // Moon entrance
        gsap.to(moon, {
            opacity: 1,
            scale: 1,
            duration: 2,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '#moon-section',
                start: 'top 70%',
                toggleActions: 'play none none none',
            }
        });

        // Parallax on moon
        gsap.to(moon, {
            y: -40,
            scrollTrigger: {
                trigger: '#moon-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.5,
            }
        });

        // Moon text lines
        lines.forEach((line, i) => {
            gsap.to(line, {
                opacity: 1,
                y: 0,
                duration: 1.3,
                delay: i * 0.3,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: line,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                }
            });
        });
    }

    // ---- FINAL SECTION ANIMATIONS ----
    setupFinalAnimations() {
        const lines = document.querySelectorAll('.final-line');
        const divider = document.querySelector('.final-divider');
        const infinity = document.getElementById('final-infinity');
        const forever = document.querySelector('.final-forever');
        const signature = document.querySelector('.final-signature');

        // Lines
        lines.forEach((line, i) => {
            gsap.to(line, {
                opacity: 1,
                y: 0,
                duration: 1.3,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: line,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                }
            });
        });

        // Divider
        if (divider) {
            gsap.to(divider, {
                opacity: 0.5,
                duration: 1,
                scrollTrigger: {
                    trigger: divider,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                }
            });
        }

        // Infinity symbol
        if (infinity) {
            gsap.to(infinity, {
                opacity: 1,
                scale: 1,
                duration: 2,
                ease: 'elastic.out(1, 0.5)',
                scrollTrigger: {
                    trigger: infinity,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                    onEnter: () => infinity.classList.add('visible'),
                }
            });
        }

        // Forever Yours
        if (forever) {
            gsap.to(forever, {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: forever,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                }
            });
        }

        // Final signature
        if (signature) {
            gsap.to(signature, {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: signature,
                    start: 'top 90%',
                    toggleActions: 'play none none none',
                }
            });
        }
    }

    // ---- HEARTBEAT EFFECT ----
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.heartbeatVignette.classList.add('pulse');
            setTimeout(() => {
                this.heartbeatVignette.classList.remove('pulse');
            }, 1300);
        }, 8000);
    }

    // ---- DYNAMIC TOUCH / CURSOR SPARKLES ----
    setupTouchSparkles() {
        let lastSpawn = 0;
        const spawnSparkle = (x, y) => {
            const now = performance.now();
            if (now - lastSpawn < 40) return;
            lastSpawn = now;

            const sparkle = document.createElement('div');
            sparkle.className = 'touch-sparkle';
            const size = Math.random() * 6 + 4;
            sparkle.style.width = `${size}px`;
            sparkle.style.height = `${size}px`;
            sparkle.style.left = `${x}px`;
            sparkle.style.top = `${y}px`;
            sparkle.style.background = Math.random() > 0.4 ? '#D4A373' : '#FFF8F0';
            document.body.appendChild(sparkle);

            const destX = (Math.random() - 0.5) * 40;
            const destY = -(Math.random() * 50 + 20);

            sparkle.animate([
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.9 },
                { transform: `translate(calc(-50% + ${destX}px), calc(-50% + ${destY}px)) scale(0)`, opacity: 0 }
            ], {
                duration: 750 + Math.random() * 250,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => sparkle.remove();
        };

        window.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches[0]) {
                spawnSparkle(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches[0]) {
                spawnSparkle(e.touches[0].clientX, e.touches[0].clientY);
            }
            if (this.piano) this.piano.resumeAudio();
        }, { passive: true });

        window.addEventListener('mousemove', (e) => {
            if (Math.random() > 0.65) {
                spawnSparkle(e.clientX, e.clientY);
            }
        }, { passive: true });
    }

    // ---- RESPONSIVE LISTENERS ----
    setupResponsiveListeners() {
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                ScrollTrigger.refresh();
            }, 200);
        }, { passive: true });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                ScrollTrigger.refresh();
            }, 350);
        }, { passive: true });
    }
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // Launch the experience
    const app = new LoveLetterApp();
});
