// 80s Retro Terminal JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the terminal
    initializeTerminal();
    
    // Set up navigation
    setupNavigation();
    
    // Set up keyboard navigation
    setupKeyboardNavigation();
    
    // Add some retro effects
    addRetroEffects();
});

function initializeTerminal() {
    console.log('INITIALIZING TERMINAL...');
    
    // Hide boot sequence after animation
    setTimeout(() => {
        const bootSequence = document.querySelector('.boot-sequence');
        if (bootSequence) {
            bootSequence.style.display = 'none';
        }
    }, 3000);
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            switchSection(target);
        });
        
        // Add hover sound effect simulation
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.05)';
            addGlitchEffect(this);
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            removeGlitchEffect(this);
        });
    });
}

function switchSection(targetId) {
    // Hide all sections
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Add entrance animation
        targetSection.style.animation = 'none';
        targetSection.offsetHeight; // Trigger reflow
        targetSection.style.animation = 'slideIn 0.5s ease';
    }
    
    // Update active nav item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('focused');
        if (item.getAttribute('data-target') === targetId) {
            item.classList.add('focused');
        }
    });
}

function setupKeyboardNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    let currentIndex = 0;
    
    // Set initial focus
    if (navItems.length > 0) {
        navItems[0].classList.add('focused');
        navItems[0].focus();
    }
    
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'ArrowRight':
                e.preventDefault();
                currentIndex = (currentIndex + 1) % navItems.length;
                updateFocus();
                break;
                
            case 'ArrowLeft':
                e.preventDefault();
                currentIndex = (currentIndex - 1 + navItems.length) % navItems.length;
                updateFocus();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                currentIndex = (currentIndex - 2 + navItems.length) % navItems.length;
                updateFocus();
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                currentIndex = (currentIndex + 2) % navItems.length;
                updateFocus();
                break;
                
            case 'Enter':
            case ' ':
                e.preventDefault();
                const target = navItems[currentIndex].getAttribute('data-target');
                switchSection(target);
                break;
        }
    });
    
    function updateFocus() {
        navItems.forEach((item, index) => {
            item.classList.remove('focused');
            if (index === currentIndex) {
                item.classList.add('focused');
                item.focus();
            }
        });
    }
}

function addGlitchEffect(element) {
    element.style.textShadow = '0 0 5px #48dbfb';
}

function removeGlitchEffect(element) {
    element.style.textShadow = '';
}

function addRetroEffects() {
    // Add subtle particle effect
    createParticleRain();

    // Add floating feathers
    createFloatingFeathers();

    // Add mountain mist effects
    createMountainMist();

    // Add typing effect to some elements
    addTypingEffect();
}

function createParticleRain() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    canvas.style.opacity = '0.06';
    
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 0.2 + Math.random() * 0.3,
            size: 0.3 + Math.random() * 0.8,
            opacity: 0.03 + Math.random() * 0.1
        });
    }
    
    function draw() {
        ctx.fillStyle = 'rgba(10, 26, 42, 0.03)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            ctx.fillStyle = `rgba(127, 219, 218, ${particle.opacity})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            particle.y += particle.speed;
            if (particle.y > canvas.height) {
                particle.y = -10;
                particle.x = Math.random() * canvas.width;
            }
        });
    }
    
    setInterval(draw, 100);
}

function createFloatingFeathers() {
    const featherContainer = document.createElement('div');
    featherContainer.style.position = 'fixed';
    featherContainer.style.top = '0';
    featherContainer.style.left = '0';
    featherContainer.style.width = '100%';
    featherContainer.style.height = '100%';
    featherContainer.style.pointerEvents = 'none';
    featherContainer.style.zIndex = '3';
    featherContainer.style.overflow = 'hidden';
    
    document.body.appendChild(featherContainer);
    
    // Create multiple feathers with different paths
    for (let i = 0; i < 8; i++) {
        createFeather(featherContainer, i);
    }
}

function createFeather(container, index) {
    const feather = document.createElement('div');
    feather.style.position = 'absolute';
    feather.style.width = (15 + Math.random() * 20) + 'px';
    feather.style.height = (8 + Math.random() * 12) + 'px';
    feather.style.background = `radial-gradient(ellipse ${feather.style.width} ${feather.style.height} at center, rgba(255, 255, 255, ${0.2 + Math.random() * 0.3}) 0%, transparent 70%)`;
    feather.style.borderRadius = '50%';
    feather.style.opacity = '0.6';
    feather.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
    
    // Position feather off-screen initially
    feather.style.left = Math.random() * window.innerWidth + 'px';
    feather.style.top = window.innerHeight + 50 + 'px';
    
    container.appendChild(feather);
    
    // Animate feather floating
    let startTime = Date.now() + (index * 2000); // Stagger start times
    
    function animateFeather() {
        const elapsed = Date.now() - startTime;
        const duration = 15000 + Math.random() * 10000; // 15-25 seconds
        
        if (elapsed < duration) {
            const progress = elapsed / duration;
            
            // Create a gentle floating path
            const x = parseFloat(feather.style.left) + Math.sin(progress * Math.PI * 4) * 2;
            const y = parseFloat(feather.style.top) - (progress * (window.innerHeight + 100));
            const rotation = parseFloat(feather.style.transform.match(/rotate\(([^)]+)\)/)[1]) + 0.5;
            const opacity = 0.6 + Math.sin(progress * Math.PI * 2) * 0.2;
            
            feather.style.left = x + 'px';
            feather.style.top = y + 'px';
            feather.style.transform = `rotate(${rotation}deg)`;
            feather.style.opacity = opacity;
            
            requestAnimationFrame(animateFeather);
        } else {
            // Reset feather to bottom
            feather.style.top = window.innerHeight + 50 + 'px';
            feather.style.left = Math.random() * window.innerWidth + 'px';
            startTime = Date.now() + Math.random() * 5000;
            setTimeout(animateFeather, 1000);
        }
    }
    
    setTimeout(animateFeather, index * 1000);
}

function createMountainMist() {
    const mistContainer = document.createElement('div');
    mistContainer.style.position = 'fixed';
    mistContainer.style.top = '0';
    mistContainer.style.left = '0';
    mistContainer.style.width = '100%';
    mistContainer.style.height = '100%';
    mistContainer.style.pointerEvents = 'none';
    mistContainer.style.zIndex = '1';
    mistContainer.style.overflow = 'hidden';
    
    document.body.appendChild(mistContainer);
    
    // Create mist layers
    for (let i = 0; i < 3; i++) {
        createMistLayer(mistContainer, i);
    }
}

function createMistLayer(container, layerIndex) {
    const mist = document.createElement('div');
    mist.style.position = 'absolute';
    mist.style.top = '0';
    mist.style.left = '0';
    mist.style.width = '100%';
    mist.style.height = '100%';
    mist.style.background = `radial-gradient(ellipse 800px 200px at ${30 + layerIndex * 20}% 70%, rgba(255, 255, 255, ${0.05 + layerIndex * 0.02}) 0%, transparent 60%)`;
    mist.style.opacity = '0.3';
    
    container.appendChild(mist);
    
    // Animate mist
    let startTime = Date.now() + (layerIndex * 3000);
    
    function animateMist() {
        const elapsed = Date.now() - startTime;
        const duration = 20000 + layerIndex * 5000;
        
        if (elapsed < duration) {
            const progress = elapsed / duration;
            
            // Gentle mist movement
            const x = Math.sin(progress * Math.PI * 2) * 50;
            const y = Math.cos(progress * Math.PI * 1.5) * 20;
            const opacity = 0.3 + Math.sin(progress * Math.PI * 3) * 0.1;
            
            mist.style.transform = `translate(${x}px, ${y}px)`;
            mist.style.opacity = opacity;
            
            requestAnimationFrame(animateMist);
        } else {
            startTime = Date.now();
            animateMist();
        }
    }
    
    setTimeout(animateMist, layerIndex * 2000);
}


function createWindEffects() {
    // Add floating leaves/dust particles
    setInterval(() => {
        if (Math.random() < 0.3) {
            createFloatingParticle();
        }
    }, 2000);
}

function createFloatingParticle() {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.top = Math.random() * window.innerHeight + 'px';
    particle.style.left = '-20px';
    particle.style.width = '4px';
    particle.style.height = '4px';
    particle.style.backgroundColor = 'rgba(168, 230, 207, 0.6)';
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '1000';
    particle.style.transition = 'all 8s linear';
    
    document.body.appendChild(particle);
    
    setTimeout(() => {
        particle.style.left = window.innerWidth + 'px';
        particle.style.top = (parseFloat(particle.style.top) + Math.random() * 100 - 50) + 'px';
    }, 100);
    
    setTimeout(() => {
        if (particle.parentNode) {
            document.body.removeChild(particle);
        }
    }, 8000);
}

function createGentleGlitch() {
    const glitchElement = document.createElement('div');
    glitchElement.style.position = 'fixed';
    glitchElement.style.top = Math.random() * window.innerHeight + 'px';
    glitchElement.style.left = Math.random() * window.innerWidth + 'px';
    glitchElement.style.color = '#48dbfb';
    glitchElement.style.fontFamily = 'monospace';
    glitchElement.style.fontSize = '10px';
    glitchElement.style.zIndex = '1000';
    glitchElement.style.pointerEvents = 'none';
    glitchElement.style.opacity = '0.7';
    glitchElement.textContent = '~' + Math.floor(Math.random() * 100);
    
    document.body.appendChild(glitchElement);
    
    // Animate the glitch
    let opacity = 0.7;
    const fadeInterval = setInterval(() => {
        opacity -= 0.05;
        glitchElement.style.opacity = opacity;
        
        if (opacity <= 0) {
            clearInterval(fadeInterval);
            if (glitchElement.parentNode) {
                document.body.removeChild(glitchElement);
            }
        }
    }, 100);
}

function addTypingEffect() {
    const elements = document.querySelectorAll('.cyber-text');
    
    elements.forEach((element, index) => {
        const originalText = element.textContent;
        element.textContent = '';
        
        setTimeout(() => {
            let i = 0;
            const typeInterval = setInterval(() => {
                element.textContent += originalText.charAt(i);
                i++;
                
                if (i >= originalText.length) {
                    clearInterval(typeInterval);
                }
            }, 50);
        }, 3000 + (index * 1000)); // Stagger the typing effect
    });
}

// Remove console logging override

// Add window resize handler
window.addEventListener('resize', function() {
    // Recalculate any size-dependent elements
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        // Trigger reflow to ensure proper sizing
        item.offsetHeight;
    });
});

// Add some Easter eggs
document.addEventListener('keydown', function(e) {
    // Konami code easter egg
    if (e.key === 'ArrowUp' && e.ctrlKey) {
        createEasterEgg();
    }
});

function createEasterEgg() {
    const easterEgg = document.createElement('div');
    easterEgg.style.position = 'fixed';
    easterEgg.style.top = '50%';
    easterEgg.style.left = '50%';
    easterEgg.style.transform = 'translate(-50%, -50%)';
    easterEgg.style.color = '#48dbfb';
    easterEgg.style.fontFamily = 'Orbitron, monospace';
    easterEgg.style.fontSize = '1.5rem';
    easterEgg.style.fontWeight = '600';
    easterEgg.style.textAlign = 'center';
    easterEgg.style.zIndex = '10000';
    easterEgg.style.opacity = '0.9';
    easterEgg.innerHTML = `
        <div>Hello there</div>
    `;
    
    document.body.appendChild(easterEgg);
    
    setTimeout(() => {
        if (easterEgg.parentNode) {
            document.body.removeChild(easterEgg);
        }
    }, 2000);
} 