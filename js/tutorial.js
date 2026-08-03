const steps = [...document.querySelectorAll('.tutorial-step')];
const links = [...document.querySelectorAll('[data-step-link]')];
const progress = document.querySelector('#tutorial-progress');
const lightbox = document.querySelector('#tutorial-lightbox');
const lightboxStage = document.querySelector('#lightbox-stage');
const lightboxCaption = document.querySelector('#lightbox-caption');
const lightboxClose = document.querySelector('#lightbox-close');
const backtop = document.querySelector('#tutorial-backtop');

function updateReadingProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const value = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
  progress.style.width = `${Math.round(value * 10000) / 100}%`;
  backtop.classList.toggle('visible', window.scrollY > 900);
}

function setActiveStep(step) {
  links.forEach(link => link.classList.toggle('active', link.dataset.stepLink === step));
  const active = links.find(link => link.dataset.stepLink === step);
  if (active && window.innerWidth <= 1050) {
    active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

const observer = new IntersectionObserver((entries) => {
  const visible = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
  if (visible) setActiveStep(visible.target.dataset.step);
}, { rootMargin: '-24% 0px -58% 0px', threshold: 0 });

steps.forEach(step => observer.observe(step));

document.querySelectorAll('.tutorial-shot').forEach((shot) => {
  shot.addEventListener('click', () => {
    const clone = shot.cloneNode(true);
    clone.removeAttribute('aria-label');
    clone.querySelector('img')?.removeAttribute('loading');
    lightboxStage.replaceChildren(clone);
    lightboxCaption.textContent = shot.closest('figure')?.querySelector('figcaption')?.textContent.trim() || '';
    lightbox.showModal();
    lightboxClose.focus();
  });
});

lightboxClose.addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});

window.addEventListener('scroll', updateReadingProgress, { passive: true });
window.addEventListener('resize', updateReadingProgress, { passive: true });
backtop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
updateReadingProgress();
