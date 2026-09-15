document.addEventListener('DOMContentLoaded', function() {
  // ===== BACKEND URL =====
  const BACKEND_URL = 'http://localhost:5000';

  // Mobile menu toggle
  const burger = document.querySelector('.burger');
  const navLinks = document.querySelector('.nav-links');
  
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      burger.innerHTML = navLinks.classList.contains('open') ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });

  // Reveal on scroll (Staggered animation)
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  
  revealElements.forEach(el => revealObserver.observe(el));

  // Animated counters
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const stepTime = Math.abs(Math.floor(duration / target));
        
        let current = 0;
        const timer = setInterval(() => {
          current += 1;
          counter.textContent = current;
          if (current >= target) {
            clearInterval(timer);
            counter.textContent = target;
          }
        }, stepTime);
        
        counterObserver.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(counter => counterObserver.observe(counter));

  // ===== CONTACT FORM (SMTP + Validation) =====
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const status = document.getElementById('formStatus');
      const btn = form.querySelector('button[type="submit"]');
      const originalBtn = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Sending...';

      const payload = {
        name: form.name.value,
        phone: form.phone.value,
        message: form.message.value
      };

      try {
        const res = await fetch(`${BACKEND_URL}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (status) {
          status.style.display = 'block';
          if (res.ok) {
            status.textContent = '✅ ' + (data.message || 'Enquiry sent successfully!');
            status.style.color = '#2ecc71';
            form.reset();
          } else {
            let errorMsg = data.message || 'Validation failed.';
            if (data.errors && data.errors.length > 0) {
              errorMsg += ' — ' + data.errors.join(' ');
            }
            status.textContent = '❌ ' + errorMsg;
            status.style.color = '#e74c3c';
          }
        }
      } catch (err) {
        if (status) {
          status.style.display = 'block';
          status.textContent = "❌ Couldn't reach the server. Please try again.";
          status.style.color = '#e74c3c';
        }
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtn;
        if (status) setTimeout(() => { status.style.display = 'none'; }, 6000);
      }
    });
  }
});