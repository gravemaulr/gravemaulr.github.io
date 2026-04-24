// Плавное появление секций при скролле
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

// Анимация появления hero при загрузке
document.addEventListener('DOMContentLoaded', () => {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.animation = 'fadeUp 1s ease forwards';
    }
});

// Плавный скролл для всех якорных ссылок
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Небольшой эффект параллакса для hero (опционально)
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const hero = document.querySelector('.hero');
    if (hero && scrollY < window.innerHeight) {
        const opacity = 1 - (scrollY / (window.innerHeight * 0.8));
        hero.style.opacity = Math.max(opacity, 0.3);
    }
});