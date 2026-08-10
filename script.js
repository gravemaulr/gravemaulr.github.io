const revealElements = document.querySelectorAll('.card');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});

document.addEventListener('DOMContentLoaded', () => {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.animation = 'fadeUp 1s ease forwards';
    }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const hero = document.querySelector('.hero');
    if (hero && scrollY < window.innerHeight) {
        const opacity = 1 - (scrollY / (window.innerHeight * 0.8));
        hero.style.opacity = Math.max(opacity, 0.3);
    }
});

const cards = document.querySelectorAll('.card');
cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        card.style.transform = `translateY(-6px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
    });
});

function scheduleGlitch() {
    const delay = 4000 + Math.random() * 6000;
    setTimeout(() => {
        const orbs = document.querySelectorAll('.orb');
        const orb = orbs[Math.floor(Math.random() * orbs.length)];
        if (orb) {
            orb.style.transition = 'opacity 0.08s ease';
            orb.style.opacity = '0.05';
            setTimeout(() => {
                orb.style.opacity = '';
                orb.style.transition = '';
            }, 90);
        }
        scheduleGlitch();
    }, delay);
}

scheduleGlitch();
