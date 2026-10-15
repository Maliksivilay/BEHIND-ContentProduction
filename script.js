/* =========================================================
   SETTINGS — แก้ตรงนี้ก่อนขึ้นเว็บ
========================================================= */

const BUSINESS_EMAIL = "your@email.com";   // ← เปลี่ยนเป็นอีเมลธุรกิจจริง

/* บอกหน้าเว็บว่า script.js โหลดแล้ว (ถ้าไม่โหลด หัวเว็บจะกลับเป็นแบบธรรมดาเอง) */

window.__heroReady = true;

const root = document.documentElement;


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
   HERO — โลโก้เด้งเข้ามา แล้วค่อย ๆ จางตอนเลื่อนลง
   (ผูกกับตำแหน่งการเลื่อน: เลื่อนกลับขึ้นโลโก้ก็กลับมา)
========================================================= */

const hero = document.querySelector(".hero");

if (hero && root.classList.contains("roll")) {

    const heroStage   = hero.querySelector(".hero-stage");
    const heroLogo    = hero.querySelector(".hero-logo");
    const heroContent = hero.querySelector(".hero-content");
    const heroHint    = hero.querySelector(".hero-scroll");


    /* ---------- ปรับค่าได้ตรงนี้ ---------- */

    const END_SCALE  = 0.82;   // ขนาดโลโก้ตอนจาง (1 = ไม่ย่อ)
    const MAX_BLUR   = 10;     // ความเบลอสูงสุดของโลโก้ตอนจาง (px)
    const LIFT       = 0.05;   // โลโก้ลอยขึ้นเล็กน้อยตอนจาง (สัดส่วนของความสูงจอ)
    const ANIM_END   = 0.8;    // เลื่อนถึง 80% แอนิเมชันจบ ที่เหลือค้างให้อ่านข้อความ


    const clamp01 = v => Math.min(1, Math.max(0, v));

    let heroTicking = false;

    const updateHero = () => {

        heroTicking = false;

        const stageH = heroStage.offsetHeight;
        const total  = hero.offsetHeight - stageH;

        if (total <= 0) return;

        const scrolled = -hero.getBoundingClientRect().top;

        const q = clamp01(clamp01(scrolled / total) / ANIM_END);


        /* โลโก้: ย่อเล็กน้อย + เบลอ + จางหาย */

        const fade  = clamp01((q - 0.08) / 0.55);
        const scale = 1 - (1 - END_SCALE) * fade;
        const blur  = MAX_BLUR * fade * fade;
        const lift  = -fade * stageH * LIFT;

        heroLogo.style.transform =
            `translate3d(-50%, -50%, 0) translate3d(0, ${lift}px, 0) scale(${scale})`;

        heroLogo.style.opacity = 1 - fade;

        heroLogo.style.filter = blur > 0.1 ? `blur(${blur}px)` : "none";


        /* ข้อความ: ค่อย ๆ ชัดขึ้นมาแทน */

        const t = clamp01((q - 0.4) / 0.4);

        heroContent.style.opacity = t;

        heroContent.style.transform =
            `translate3d(-50%, -50%, 0) translate3d(0, ${(1 - t) * 36}px, 0)`;

        heroContent.style.filter = t < 0.99 ? `blur(${(1 - t) * 10}px)` : "none";

        heroContent.style.pointerEvents = t > 0.5 ? "auto" : "none";


        /* ข้อความ "เลื่อนลงเพื่อดู" จางหาย */

        if (heroHint) heroHint.style.opacity = 1 - clamp01(q * 8);

    };

    const requestHeroUpdate = () => {

        if (!heroTicking) {

            heroTicking = true;

            requestAnimationFrame(updateHero);

        }

    };

    window.addEventListener("scroll", requestHeroUpdate, { passive: true });
    window.addEventListener("resize", requestHeroUpdate);
    window.addEventListener("load", requestHeroUpdate);

    updateHero();

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

    filterPill.style.width = button.offsetWidth + "px";

    filterPill.style.transform = `translateX(${button.offsetLeft}px)`;

}

function currentFilter() {

    return document.querySelector(".filter.active");

}

movePill(currentFilter());

window.addEventListener("resize", () => movePill(currentFilter()));

window.addEventListener("load", () => movePill(currentFilter()));

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
   CONTACT FORM
========================================================= */

const form = document.getElementById("contactForm");

if (form) {

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        const formData = new FormData(form);

        const name = formData.get("name");
        const email = formData.get("email");
        const project = formData.get("project");
        const message = formData.get("message");

        const subject =
            `New Video Editing Request - ${project}`;

        const body =
            `Name: ${name}\n` +
            `Email: ${email}\n` +
            `Project: ${project}\n\n` +
            `Message:\n${message}`;

        const mailto =
            `mailto:${BUSINESS_EMAIL}` +
            `?subject=${encodeURIComponent(subject)}` +
            `&body=${encodeURIComponent(body)}`;

        window.location.href = mailto;

    });

}


/* =========================================================
   GALAXY BACKGROUND
========================================================= */

const canvas = document.getElementById("galaxyCanvas");

const ctx = canvas.getContext("2d");

let stars = [];

let width;
let height;


/* =========================================================
   RESIZE CANVAS
========================================================= */

function resizeCanvas() {

    width = canvas.width = window.innerWidth;

    height = canvas.height = window.innerHeight;

    createStars();

}

window.addEventListener("resize", resizeCanvas);


/* =========================================================
   STAR CLASS
========================================================= */

class Star {

    constructor() {

        this.reset();

    }

    reset() {

        this.x = Math.random() * width;

        this.y = Math.random() * height;


        /* ดาวมีหลายขนาด */

        const sizeRandom = Math.random();

        if (sizeRandom > 0.97) {

            /* ดาวใหญ่ */

            this.size = Math.random() * 2.2 + 1.2;

        } else {

            /* ดาวเล็ก */

            this.size = Math.random() * 1.2 + 0.3;

        }


        /* ความเร็ว */

        this.speedX = (Math.random() - 0.5) * 0.22;

        this.speedY = (Math.random() - 0.5) * 0.22;


        /* ความสว่าง */

        this.alpha = Math.random() * 0.7 + 0.2;


        /* การกระพริบ */

        this.twinkleSpeed = Math.random() * 0.012 + 0.002;

        this.twinkleDirection = Math.random() > 0.5 ? 1 : -1;


        /* ดาวบางดวงมีความสว่างมาก */

        this.brightness = Math.random() > 0.92 ? 1 : 0.65;

    }

    update() {

        /* เคลื่อนที่ช้า ๆ */

        this.x += this.speedX;

        this.y += this.speedY;


        /* ถ้าออกนอกจอ ให้กลับเข้ามาอีกฝั่ง */

        if (this.x < -10) this.x = width + 10;

        if (this.x > width + 10) this.x = -10;

        if (this.y < -10) this.y = height + 10;

        if (this.y > height + 10) this.y = -10;


        /* กระพริบ */

        this.alpha += this.twinkleSpeed * this.twinkleDirection;

        if (this.alpha >= 0.9) this.twinkleDirection = -1;

        if (this.alpha <= 0.15) this.twinkleDirection = 1;

    }

    draw() {

        ctx.beginPath();

        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

        ctx.fillStyle =
            `rgba(255, 255, 255, ${this.alpha * this.brightness})`;

        ctx.fill();


        /* ดาวใหญ่มี Glow เล็ก ๆ */

        if (this.size > 1.2) {

            ctx.beginPath();

            ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);

            ctx.fillStyle =
                `rgba(255, 255, 255, ${this.alpha * 0.05})`;

            ctx.fill();

        }

    }

}


/* =========================================================
   CREATE STARS
========================================================= */

function createStars() {

    stars = [];

    /*
       จำนวนดาวตามขนาดหน้าจอ
       Desktop = เยอะ / Mobile = ลดลงเพื่อ Performance
    */

    let amount = Math.floor((width * height) / 6500);

    if (window.innerWidth < 768) {

        amount = Math.floor((width * height) / 8500);

    }

    /* จำกัดจำนวนสูงสุด */

    amount = Math.min(amount, 280);

    for (let i = 0; i < amount; i++) {

        stars.push(new Star());

    }

}


/* =========================================================
   ANIMATION
========================================================= */

function animate() {

    ctx.clearRect(0, 0, width, height);

    /* พื้นหลังดำ */

    ctx.fillStyle = "#000";

    ctx.fillRect(0, 0, width, height);

    /* วาดดาว */

    stars.forEach(star => {

        star.update();

        star.draw();

    });

    requestAnimationFrame(animate);

}


/* =========================================================
   START GALAXY
========================================================= */

resizeCanvas();

animate();