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

document.querySelectorAll('.btn, .social-grid a, .stack-grid span').forEach(el => {
    el.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    });
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

function createFloatingShapes() {
    const hero = document.querySelector('.hero');
    for (let i = 0; i < 5; i++) {
        const shape = document.createElement('div');
        shape.className = 'floating-shape';
        shape.style.left = Math.random() * 100 + '%';
        shape.style.top = Math.random() * 100 + '%';
        shape.style.animationDelay = Math.random() * 5 + 's';
        shape.style.animationDuration = (15 + Math.random() * 10) + 's';
        hero.appendChild(shape);
    }
}

createFloatingShapes();
