// Performance monitoring for ultimate water simulation
class PerformanceMonitor {
    constructor() {
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = 0;
        this.memoryUsage = 0;
        this.gpuMemory = 0;
        
        this.createUI();
        this.startMonitoring();
    }
    
    createUI() {
        this.ui = document.createElement('div');
        this.ui.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(this.ui);
    }
    
    startMonitoring() {
        const updateStats = () => {
            this.frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - this.lastTime >= 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastTime = currentTime;
                
                // Get memory usage
                if (performance.memory) {
                    this.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                }
                
                this.updateUI();
            }
            
            requestAnimationFrame(updateStats);
        };
        
        updateStats();
    }
    
    updateUI() {
        this.ui.innerHTML = `
            <div>🌊 ULTIMATE WATER SIMULATION</div>
            <div>FPS: ${this.fps}</div>
            <div>Memory: ${this.memoryUsage}MB</div>
            <div>WebGPU: ${navigator.gpu ? '✅' : '❌'}</div>
            <div>WebGL2: ${this.checkWebGL2() ? '✅' : '❌'}</div>
        `;
    }
    
    checkWebGL2() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');
        return gl !== null;
    }
}

// Start performance monitoring
new PerformanceMonitor();
