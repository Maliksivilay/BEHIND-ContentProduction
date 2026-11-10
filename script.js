/* =========================================================
   SETTINGS — แก้ตรงนี้ก่อนขึ้นเว็บ
========================================================= */

const DEFAULT_LANG = "en";   // ภาษาตอนเปิดเว็บครั้งแรก ("en" หรือ "lo")

const LITE_MODE = "auto";    // โหมดประหยัดเครื่อง: "auto" = ตรวจเครื่องให้เอง, "on" = เปิดตลอด (ลองดูว่าเครื่องช้าเห็นแบบไหน), "off" = ปิด


const root = document.documentElement;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/* =========================================================
   LITE MODE — โหมดประหยัดสำหรับเครื่องสเปกต่ำ
   ปิดของที่กินเครื่อง (เบลอกระจก navbar, แสงเรืองขยับ, เอียงตามเมาส์) ดาวน้อยลง
   แต่โลโก้ใหญ่ + การบินเข้า navbar ยังอยู่ครบ
========================================================= */

function enableLite() {

    root.classList.add("lite");

}

if (LITE_MODE === "on") {

    enableLite();

} else if (LITE_MODE === "auto") {

    const memory   = navigator.deviceMemory || 8;          // แรม (GB) — มีเฉพาะ Chrome/Android
    const cores    = navigator.hardwareConcurrency || 8;   // จำนวนแกน CPU
    const saveData = navigator.connection && navigator.connection.saveData;

    if (memory <= 2 || cores <= 2 || saveData) {

        enableLite();

    } else {

        /* วัดความลื่นจริง 1 วินาที หลังเว็บโหลดเสร็จ
           ถ้าได้ต่ำกว่า 40 เฟรม/วินาที (ปกติ 60) → เปิดโหมดประหยัด */

        window.addEventListener("load", () => {

            setTimeout(() => {

                if (document.hidden) return;

                let frames = 0;

                const start = performance.now();

                const count = now => {

                    frames++;

                    if (now - start < 1000) requestAnimationFrame(count);

                    else if (frames < 40 && !document.hidden) enableLite();

                };

                requestAnimationFrame(count);

            }, 1500);

        });

    }

}


/* =========================================================
   LANGUAGE — English / ລາວ (ปุ่มมุมขวาบน)
   - ภาษาอังกฤษ = ข้อความปกติใน HTML
   - ภาษาลาว   = data-lo="..." (ข้อความ), data-lo-alt="..." (alt รูป)
   - เลือกภาษาไหนไว้ เว็บจะจำไว้ เปิดครั้งหน้าก็ยังเป็นภาษานั้น
========================================================= */

const LANG_KEY = "behind-lang";

const LANG_ATTRS = ["alt", "aria-label", "content"];

function applyLang(lang) {

    const lo = lang === "lo";

    root.lang = lo ? "lo" : "en";


    /* ข้อความ */

    document.querySelectorAll("[data-lo]").forEach(el => {

        if (!el.hasAttribute("data-en")) el.setAttribute("data-en", el.innerHTML);

        el.innerHTML = el.getAttribute(lo ? "data-lo" : "data-en");

    });


    /* alt / aria-label / meta content */

    LANG_ATTRS.forEach(attr => {

        document.querySelectorAll(`[data-lo-${attr}]`).forEach(el => {

            const enKey = `data-en-${attr}`;

            if (!el.hasAttribute(enKey)) el.setAttribute(enKey, el.getAttribute(attr) || "");

            el.setAttribute(attr, el.getAttribute(lo ? `data-lo-${attr}` : enKey));

        });

    });


    /* ปุ่มเลือกภาษา */

    document.querySelectorAll(".lang-switch button").forEach(button => {

        button.setAttribute("aria-pressed", String(button.dataset.lang === root.lang));

    });


    /* บอกส่วนอื่นของเว็บว่าเปลี่ยนภาษาแล้ว (เช่น แคปซูลปุ่ม filter ต้องวัดความกว้างใหม่) */

    window.dispatchEvent(new CustomEvent("langchange", { detail: root.lang }));

}

function savedLang() {

    try {

        return localStorage.getItem(LANG_KEY);

    } catch (error) {

        return null;

    }

}

document.querySelectorAll(".lang-switch button").forEach(button => {

    button.addEventListener("click", () => {

        const lang = button.dataset.lang;

        try {

            localStorage.setItem(LANG_KEY, lang);

        } catch (error) {}

        applyLang(lang);

    });

});

applyLang(savedLang() === "lo" || savedLang() === "en" ? savedLang() : DEFAULT_LANG);


/* =========================================================
   NAVBAR — เข้มขึ้นเมื่อเลื่อนลง
========================================================= */

const navbar = document.getElementById("navbar");

function updateNavbar() {

    if (navbar) navbar.classList.toggle("scrolled", window.scrollY > 24);

}

window.addEventListener("scroll", updateNavbar, { passive: true });

updateNavbar();


/* =========================================================
   HERO — "Split" (ดูว่ามีอะไรอยู่เบื้องหลัง)
   - จอแรก: โลโก้ใหญ่กลางจอ (เด้ง + ลอย + แสงเรือง ใช้ CSS / คอม: เอียงตามเมาส์)
   - เลื่อนลง: จอค้างไว้ แล้ว
       1) แสงลอดจากรอยแยกกลางโลโก้
       2) B·H ครึ่งซ้าย/ขวา เปิดออกเหมือนประตู
       3) ตัวหนังสือ ເບື້ອງຫຼັງ / BEHIND หลุดออกแล้วเลื่อนลงไป
       4) ข้อความ All-in-One + ปุ่ม โผล่ขึ้นมาตรงกลาง
   - เลื่อนกลับขึ้น: ทุกชิ้นกลับมาประกอบเป็นโลโก้เหมือนเดิม

   ลื่นในเครื่องสเปกต่ำ: JS ทำงานเฉพาะตอนเลื่อน และเปลี่ยนแค่ transform + opacity
========================================================= */

const hero       = document.querySelector(".hero");
const heroStage  = document.querySelector(".hero-stage");
const heroLogo   = document.getElementById("heroLogo");
const heroText   = document.querySelector(".hero-content");
const heroScroll = document.getElementById("heroScroll");
const heroTilt   = document.querySelector(".hero-logo-tilt");

if (hero && heroStage && heroLogo && heroText && !reduceMotion) {


    /* ---------- ปรับค่าได้ตรงนี้ ---------- */

    const DOOR_ANGLE = 38;     // องศาที่ครึ่งโลโก้หมุนเปิดออก
    const TEXT_DROP  = 0.5;    // ตัวหนังสือในโลโก้เลื่อนลงไปไกลแค่ไหน (0.5 = ครึ่งจอ)
    const MAX_TILT   = 9;      // องศาที่โลโก้เอียงตามเมาส์ (เฉพาะคอม)


    root.classList.add("split");

    const clamp01   = v => Math.min(1, Math.max(0, v));
    const range     = (p, a, b) => clamp01((p - a) / (b - a));   // p อยู่ช่วง a→b คิดเป็น 0→1
    const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeIn    = t => t * t * t;
    const easeOut   = t => 1 - Math.pow(1 - t, 3);

    const lefts  = heroLogo.querySelectorAll(".logo-left");
    const rights = heroLogo.querySelectorAll(".logo-right");
    const word   = heroLogo.querySelector(".logo-text");
    const seam   = heroLogo.querySelector(".logo-seam");
    const extras = heroLogo.querySelectorAll(".logo-glow, .logo-shadow, .logo-ring");

    const setAll = (list, prop, value) => list.forEach(el => el.style[prop] = value);


    /* วัดขนาด (ทำใหม่ตอนหมุนจอ/ย่อจอเท่านั้น) */

    let heroTop = 0, run = 1, travel = 0, drop = 0;

    const measure = () => {

        heroTop = hero.getBoundingClientRect().top + window.scrollY;
        run     = Math.max(1, hero.offsetHeight - heroStage.offsetHeight);

        /* ครึ่งโลโก้ต้องเลื่อนไกลพอจะพ้นขอบจอ */
        travel = root.clientWidth / 2 + heroLogo.offsetWidth * 0.1;

        drop = heroStage.offsetHeight * TEXT_DROP;

    };


    /* วางทุกชิ้นตามตำแหน่งการเลื่อน (p: 0 = บนสุด, 1 = เล่นจบ) */

    let lastP = -1;

    const update = () => {

        const p = clamp01((window.scrollY - heroTop) / run);

        if (p === lastP) return;

        lastP = p;


        /* 1-2) ประตูซ้าย/ขวา */

        const t = range(p, 0, 0.75);
        const e = easeInOut(t);

        const dx    = (e * travel).toFixed(1);
        const angle = (e * DOOR_ANGLE).toFixed(2);
        const fade  = (1 - range(t, 0.65, 1)).toFixed(3);

        setAll(lefts,  "transform", `perspective(1200px) translate3d(-${dx}px, 0, 0) rotateY(${angle}deg)`);
        setAll(rights, "transform", `perspective(1200px) translate3d(${dx}px, 0, 0) rotateY(-${angle}deg)`);
        setAll(lefts,  "opacity", fade);
        setAll(rights, "opacity", fade);

        /* แสงลอดรอยแยก: สว่างทันทีที่เริ่มเลื่อน แล้วจางไปตอนแยกกว้าง */
        seam.style.opacity = (range(t, 0, 0.04) * (1 - range(t, 0.14, 0.45))).toFixed(3);

        /* แสงเรือง/เงา/วงแหวน จางออกตอนเริ่มแยก */
        setAll(extras, "opacity", (1 - range(t, 0, 0.18)).toFixed(3));


        /* 3) ตัวหนังสือในโลโก้ เลื่อนลงไป */

        const fall = easeIn(range(p, 0, 0.6));

        word.style.transform = `translate3d(0, ${(fall * drop).toFixed(1)}px, 0)`;
        word.style.opacity   = (1 - range(p, 0.25, 0.6)).toFixed(3);


        /* 4) ข้อความ All-in-One โผล่ขึ้นมา */

        const show = easeOut(range(p, 0.15, 0.8));

        heroText.style.opacity       = show.toFixed(3);
        heroText.style.transform     = `scale(${(0.9 + 0.1 * show).toFixed(4)})`;
        heroText.style.pointerEvents = show > 0.6 ? "auto" : "none";

        /* โลโก้ไม่บังปุ่มตอนแยกเสร็จแล้ว */
        heroLogo.style.pointerEvents = t >= 1 ? "none" : "";


        if (heroScroll) heroScroll.style.opacity = (1 - range(p, 0, 0.15)).toFixed(3);

    };

    let ticking = false;

    const requestUpdate = () => {

        if (ticking) return;

        ticking = true;

        requestAnimationFrame(() => {

            ticking = false;

            update();

        });

    };

    const remeasure = () => {

        measure();

        lastP = -1;

        update();

    };

    measure();

    update();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", remeasure);
    window.addEventListener("load", remeasure);


    /* ปุ่ม "Scroll down": เลื่อนไปจุดที่ข้อความโผล่ครบพอดี */

    if (heroScroll) {

        heroScroll.addEventListener("click", event => {

            event.preventDefault();

            window.scrollTo({ top: heroTop + run * 0.85, behavior: "smooth" });

        });

    }


    /* ---------- เอียงตามเมาส์ (เฉพาะคอมที่ไม่ใช่โหมดประหยัด) ---------- */

    if (heroTilt && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {

        let tiltTicking = false;
        let mouseX = 0;
        let mouseY = 0;

        const applyTilt = () => {

            tiltTicking = false;

            if (root.classList.contains("lite") || window.scrollY > heroTop + 40) {

                heroTilt.style.transform = "";

                return;

            }

            heroTilt.style.transform =
                `perspective(1000px) rotateX(${(-mouseY * MAX_TILT).toFixed(2)}deg) rotateY(${(mouseX * MAX_TILT).toFixed(2)}deg)`;

        };

        window.addEventListener("pointermove", event => {

            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = (event.clientY / window.innerHeight) * 2 - 1;

            if (!tiltTicking) {

                tiltTicking = true;

                requestAnimationFrame(applyTilt);

            }

        }, { passive: true });

        root.addEventListener("mouseleave", () => {

            heroTilt.style.transform = "";

        });

    }

}


/* =========================================================
   SPOTLIGHT — แสงตามเมาส์ในการ์ด (.spot)
========================================================= */

document.querySelectorAll(".spot").forEach(card => {

    card.addEventListener("pointermove", event => {

        const rect = card.getBoundingClientRect();

        card.style.setProperty("--mx", (event.clientX - rect.left) + "px");

        card.style.setProperty("--my", (event.clientY - rect.top) + "px");

    });

});


/* =========================================================
   VIDEO PREVIEW (เล่นพร้อมเสียง)
   - พยายามเล่นแบบมีเสียงก่อน
   - ถ้าเบราว์เซอร์บล็อก (ผู้ใช้ยังไม่เคยกดอะไรในหน้าเว็บ)
     จะเล่นแบบปิดเสียงแทน
   - พอผู้ใช้กด/แตะที่ไหนก็ได้ในหน้าเว็บ 1 ครั้ง
     คลิปถัดไปจะมีเสียงทันที
   - คอม: ชี้การ์ดแล้วเล่น เอาเมาส์ออกแล้วหยุด
   - มือถือ: เลื่อนมาเห็นการ์ดแล้วเล่น (เล่นทีละคลิป)
========================================================= */

const videos = document.querySelectorAll(".work-card video");

const canHover = window.matchMedia("(hover: hover)").matches;


function playVideo(video) {

    video.muted = false;

    video.play().catch(() => {

        /* ถูกบล็อกเสียง → เล่นแบบปิดเสียงแทน */

        video.muted = true;

        video.play().catch(() => {});

    });

}


if (canHover) {

    videos.forEach(video => {

        const card = video.closest(".work-card");

        card.addEventListener("mouseenter", () => {

            playVideo(video);

        });

        card.addEventListener("mouseleave", () => {

            video.pause();

            video.currentTime = 0;

        });

    });

} else {

    const videoObserver = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            const video = entry.target;

            if (entry.isIntersecting) {

                /* เล่นทีละคลิป เสียงจะได้ไม่ตีกัน */

                videos.forEach(v => {

                    if (v !== video) v.pause();

                });

                playVideo(video);

            } else {

                video.pause();

            }

        });

    }, { threshold: 0.6 });

    videos.forEach(video => videoObserver.observe(video));

}


/* =========================================================
   CATEGORY FILTER (มีแคปซูลสไลด์ตามปุ่มที่เลือก)
========================================================= */

const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".work-card");
const filterPill = document.querySelector(".filter-pill");

function movePill(button) {

    if (!filterPill || !button) return;

    /* วางแคปซูลทับปุ่มที่เลือก (รองรับทั้งแบบแถวเดียว และแบบ 2 แถวบนมือถือ) */

    filterPill.style.width  = button.offsetWidth + "px";
    filterPill.style.height = button.offsetHeight + "px";

    filterPill.style.transform = `translate(${button.offsetLeft}px, ${button.offsetTop}px)`;

}

function currentFilter() {

    return document.querySelector(".filter.active");

}

movePill(currentFilter());

window.addEventListener("resize", () => movePill(currentFilter()));

window.addEventListener("load", () => movePill(currentFilter()));

window.addEventListener("langchange", () => movePill(currentFilter()));   /* เปลี่ยนภาษา → ความกว้างปุ่มเปลี่ยน */

filters.forEach(filter => {

    filter.addEventListener("click", () => {

        const category = filter.dataset.filter;


        /* เปลี่ยนปุ่ม Active */

        filters.forEach(item => {

            item.classList.remove("active");

        });

        filter.classList.add("active");

        movePill(filter);


        /* Filter ผลงาน */

        cards.forEach(card => {

            const cardCategory = card.dataset.category;

            card.classList.remove("show");

            if (
                category === "all" ||
                category === cardCategory
            ) {

                card.style.display = "";

                void card.offsetWidth;   /* ให้แอนิเมชันเล่นใหม่ */

                card.classList.add("show");

            } else {

                card.style.display = "none";

            }

        });

    });

});


/* =========================================================
   EVENTS — การ์ดงานที่กำลังจะไปถ่าย
   - คลิก / กด Enter ที่การ์ด → เปิดหน้ารายละเอียด (<dialog id="..."> ที่ตรงกับ data-event)
   - ปิดได้ 3 ทาง: ปุ่ม ✕ / คลิกพื้นที่มืดรอบ ๆ / กด Esc
   - ป้ายนับถอยหลัง "อีกกี่วัน" คำนวณจาก data-event-date="ปี-เดือน-วัน"
========================================================= */

document.querySelectorAll(".event-card[data-event]").forEach(card => {

    const dialog = document.getElementById(card.dataset.event);

    if (!dialog || typeof dialog.showModal !== "function") return;

    const open = () => {

        if (!dialog.open) dialog.showModal();

    };

    card.addEventListener("click", open);

    card.addEventListener("keydown", event => {

        if (event.key === "Enter" || event.key === " ") {

            event.preventDefault();

            open();

        }

    });

});

document.querySelectorAll(".event-modal").forEach(dialog => {

    /* คลิกพื้นที่มืดรอบ ๆ (นอกกล่อง) → ปิด */
    dialog.addEventListener("click", event => {

        if (event.target === dialog) dialog.close();

    });

    /* ปุ่มที่มี data-close (✕ และปุ่ม Contact) → ปิด */
    dialog.querySelectorAll("[data-close]").forEach(button => {

        button.addEventListener("click", () => dialog.close());

    });

});


/* ป้ายนับถอยหลัง (เปลี่ยนตามภาษาที่เลือกด้วย) */

function updateEventCountdowns() {

    const lo = root.lang === "lo";

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    document.querySelectorAll("[data-event-date]").forEach(el => {

        const [y, m, d] = el.dataset.eventDate.split("-").map(Number);

        const days = Math.round((new Date(y, m - 1, d) - today) / 86400000);

        let text;

        if (days > 1)        text = lo ? `ອີກ ${days} ມື້` : `In ${days} days`;
        else if (days === 1) text = lo ? "ມື້ອື່ນ" : "Tomorrow";
        else if (days === 0) text = lo ? "ມື້ນີ້" : "Today";
        else                 text = lo ? "ຖ່າຍແລ້ວ" : "Covered";

        el.textContent = text;

        const box = el.closest(".event-card, .event-modal");

        if (box) box.classList.toggle("is-past", days < 0);

    });

}

updateEventCountdowns();

window.addEventListener("langchange", updateEventCountdowns);


/* =========================================================
   GALAXY BACKGROUND — ดาวลอยไปมา + กระพริบทีละดวง (แบบช่วงแรก)

   ทำให้เบาเครื่อง (หน้าตาเหมือนเดิม):
   - เตรียม "รูปดาว" แต่ละขนาดไว้ก่อนครั้งเดียว แล้วแปะลงไป
     แทนการวาดวงกลมใหม่ทุกดวงทุกเฟรม
   - วาด 30 ครั้ง/วินาที (ดาวขยับช้า ตาแยกไม่ออกจาก 60)
     โหมดประหยัด: ดาวน้อยลง + วาด 20 ครั้ง/วินาที
   - สลับไปแท็บอื่น เบราว์เซอร์หยุดวาดให้เอง
========================================================= */

const canvas = document.getElementById("galaxyCanvas");

const ctx = canvas ? canvas.getContext("2d") : null;


/* ---------- ปรับค่าได้ตรงนี้ ---------- */

const STAR_FPS      = 30;    // วาดดาวกี่ครั้งต่อวินาที
const STAR_FPS_LITE = 20;    // ...ในโหมดประหยัด
const STAR_MAX      = 280;   // จำนวนดาวสูงสุด
const STAR_MAX_LITE = 150;   // ...ในโหมดประหยัด
const STAR_SPEED    = 0.22;  // ความเร็วดาวลอย (ยิ่งมากยิ่งเร็ว)


let stars = [];

let width  = 0;
let height = 0;


/* ---------- รูปดาวสำเร็จรูป (ทำครั้งเดียว) ---------- */

const SPRITE_STEPS = 12;     // แบ่งขนาดดาวเป็นกี่ขนาด

const sprites = [];

function makeSprite(radius) {

    const glow = radius > 1.2;   // ดาวใหญ่มี Glow เล็ก ๆ

    const reach = glow ? radius * 3 : radius;

    const size = Math.ceil(reach * 2) + 4;

    const sprite = document.createElement("canvas");

    sprite.width = sprite.height = size;

    const s = sprite.getContext("2d");

    const c = size / 2;

    if (glow) {

        s.beginPath();
        s.arc(c, c, radius * 3, 0, Math.PI * 2);
        s.fillStyle = "rgba(255, 255, 255, 0.06)";
        s.fill();

    }

    s.beginPath();
    s.arc(c, c, radius, 0, Math.PI * 2);
    s.fillStyle = "#fff";
    s.fill();

    return { canvas: sprite, half: c };

}

/* ขนาดดาวมีตั้งแต่ 0.3 ถึง 3.4 px */

for (let i = 0; i < SPRITE_STEPS; i++) {

    sprites.push(makeSprite(0.3 + (3.1 * i) / (SPRITE_STEPS - 1)));

}

function spriteFor(radius) {

    const i = Math.round(((radius - 0.3) / 3.1) * (SPRITE_STEPS - 1));

    return sprites[Math.min(SPRITE_STEPS - 1, Math.max(0, i))];

}


/* ---------- ดาว 1 ดวง ---------- */

function newStar() {

    /* ดาวมีหลายขนาด */

    const radius = Math.random() > 0.97
        ? Math.random() * 2.2 + 1.2      // ดาวใหญ่
        : Math.random() * 1.2 + 0.3;     // ดาวเล็ก

    return {

        x: Math.random() * width,
        y: Math.random() * height,

        sprite: spriteFor(radius),

        /* ความเร็ว (ลอยไปมาช้า ๆ คนละทิศ) */
        speedX: (Math.random() - 0.5) * STAR_SPEED,
        speedY: (Math.random() - 0.5) * STAR_SPEED,

        /* ความสว่าง + การกระพริบ */
        alpha: Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 0.012 + 0.002,
        twinkleDirection: Math.random() > 0.5 ? 1 : -1,

        /* ดาวบางดวงสว่างเป็นพิเศษ */
        brightness: Math.random() > 0.92 ? 1 : 0.65

    };

}

const isLite = () => root.classList.contains("lite");

function createStars() {

    const density = width < 768 ? 8500 : 6500;

    const amount = Math.min(Math.floor((width * height) / density), isLite() ? STAR_MAX_LITE : STAR_MAX);

    stars = [];

    for (let i = 0; i < amount; i++) stars.push(newStar());

}


/* ---------- ขนาด canvas ---------- */

function resizeCanvas() {

    if (!canvas) return;

    const w = window.innerWidth;

    /* สูงเผื่อแถบเบราว์เซอร์มือถือหด/ขยาย จะได้ไม่ต้องสร้างดาวใหม่บ่อย ๆ */
    const h = Math.max(window.innerHeight, screen.height || 0);

    if (w === width && h <= height) return;

    width  = canvas.width  = w;
    height = canvas.height = h;

    canvas.style.width  = w + "px";
    canvas.style.height = h + "px";

    createStars();

}


/* ---------- วาดดาว ---------- */

function drawStars(step) {

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < stars.length; i++) {

        const star = stars[i];


        /* เคลื่อนที่ช้า ๆ (ออกนอกจอ → กลับเข้ามาอีกฝั่ง) */

        star.x += star.speedX * step;
        star.y += star.speedY * step;

        if (star.x < -10) star.x = width + 10;
        else if (star.x > width + 10) star.x = -10;

        if (star.y < -10) star.y = height + 10;
        else if (star.y > height + 10) star.y = -10;


        /* กระพริบ */

        star.alpha += star.twinkleSpeed * star.twinkleDirection * step;

        if (star.alpha >= 0.9) { star.alpha = 0.9; star.twinkleDirection = -1; }
        if (star.alpha <= 0.15) { star.alpha = 0.15; star.twinkleDirection = 1; }


        ctx.globalAlpha = star.alpha * star.brightness;

        ctx.drawImage(star.sprite.canvas, star.x - star.sprite.half, star.y - star.sprite.half);

    }

    ctx.globalAlpha = 1;

}

let lastDraw = 0;

function animate(now) {

    requestAnimationFrame(animate);

    const fps = isLite() ? STAR_FPS_LITE : STAR_FPS;

    const elapsed = now - lastDraw;

    if (elapsed < 1000 / fps - 2) return;

    /* ขยับตามเวลาจริง (ความเร็วเท่ากับแบบเดิมที่ 60 เฟรม/วินาที) */
    const step = Math.min(elapsed / (1000 / 60), 4);

    lastDraw = now;

    drawStars(step);

}


/* ---------- เริ่ม ---------- */

if (canvas && ctx) {

    let resizeTimer;

    window.addEventListener("resize", () => {

        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(resizeCanvas, 150);

    });

    resizeCanvas();

    if (reduceMotion) {

        drawStars(0);   // ปิดแอนิเมชันในเครื่อง → ดาวอยู่นิ่ง

    } else {

        requestAnimationFrame(now => {

            lastDraw = now;

            requestAnimationFrame(animate);

        });

    }

}
