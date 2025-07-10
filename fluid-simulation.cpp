#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <vector>
#include <cmath>
#include <algorithm>

using namespace emscripten;

class FluidSimulation {
private:
    std::vector<float> heightMap;
    std::vector<float> velocityMap;
    std::vector<float> pressureMap;
    int width, height;
    float dt, viscosity, surfaceTension, gravity;
    
public:
    FluidSimulation(int w, int h) : width(w), height(h), dt(0.016f), 
                                   viscosity(0.001f), surfaceTension(0.0728f), gravity(9.81f) {
        heightMap.resize(width * height, 0.0f);
        velocityMap.resize(width * height * 2, 0.0f); // 2D velocity
        pressureMap.resize(width * height, 0.0f);
    }
    
    void step() {
        // Advection
        advect();
        
        // Apply forces
        applyForces();
        
        // Pressure solve
        solvePressure();
        
        // Viscosity
        applyViscosity();
        
        // Surface tension
        applySurfaceTension();
    }
    
    void addForce(int x, int y, float fx, float fy) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
            int idx = (y * width + x) * 2;
            velocityMap[idx] += fx * dt;
            velocityMap[idx + 1] += fy * dt;
        }
    }
    
    void setHeight(int x, int y, float h) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
            heightMap[y * width + x] = h;
        }
    }
    
    float getHeight(int x, int y) const {
        if (x >= 0 && x < width && y >= 0 && y < height) {
            return heightMap[y * width + x];
        }
        return 0.0f;
    }
    
    val getHeightMap() const {
        return val(typed_memory_view(heightMap.size(), heightMap.data()));
    }
    
    val getVelocityMap() const {
        return val(typed_memory_view(velocityMap.size(), velocityMap.data()));
    }
    
private:
    void advect() {
        std::vector<float> newHeightMap = heightMap;
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int idx = y * width + x;
                int velIdx = idx * 2;
                
                float vx = velocityMap[velIdx];
                float vy = velocityMap[velIdx + 1];
                
                // Semi-Lagrangian advection
                float backX = x - vx * dt;
                float backY = y - vy * dt;
                
                // Bilinear interpolation
                int x0 = std::max(0, std::min(width - 1, (int)backX));
                int y0 = std::max(0, std::min(height - 1, (int)backY));
                int x1 = std::min(width - 1, x0 + 1);
                int y1 = std::min(height - 1, y0 + 1);
                
                float fx = backX - x0;
                float fy = backY - y0;
                
                float h00 = heightMap[y0 * width + x0];
                float h10 = heightMap[y0 * width + x1];
                float h01 = heightMap[y1 * width + x0];
                float h11 = heightMap[y1 * width + x1];
                
                newHeightMap[idx] = (1 - fx) * (1 - fy) * h00 + 
                                   fx * (1 - fy) * h10 + 
                                   (1 - fx) * fy * h01 + 
                                   fx * fy * h11;
            }
        }
        
        heightMap = newHeightMap;
    }
    
    void applyForces() {
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int velIdx = (y * width + x) * 2;
                velocityMap[velIdx + 1] -= gravity * dt; // Apply gravity
            }
        }
    }
    
    void solvePressure() {
        // Simple pressure solve using Jacobi iteration
        std::vector<float> newPressureMap = pressureMap;
        
        for (int iter = 0; iter < 20; iter++) {
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    int idx = y * width + x;
                    
                    float sum = 0.0f;
                    int count = 0;
                    
                    if (x > 0) { sum += pressureMap[idx - 1]; count++; }
                    if (x < width - 1) { sum += pressureMap[idx + 1]; count++; }
                    if (y > 0) { sum += pressureMap[idx - width]; count++; }
                    if (y < height - 1) { sum += pressureMap[idx + width]; count++; }
                    
                    if (count > 0) {
                        newPressureMap[idx] = sum / count;
                    }
                }
            }
            pressureMap = newPressureMap;
        }
        
        // Apply pressure gradient
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int idx = y * width + x;
                int velIdx = idx * 2;
                
                float px = 0.0f, py = 0.0f;
                
                if (x > 0) px += pressureMap[idx] - pressureMap[idx - 1];
                if (x < width - 1) px += pressureMap[idx + 1] - pressureMap[idx];
                if (y > 0) py += pressureMap[idx] - pressureMap[idx - width];
                if (y < height - 1) py += pressureMap[idx + width] - pressureMap[idx];
                
                velocityMap[velIdx] -= px * dt;
                velocityMap[velIdx + 1] -= py * dt;
            }
        }
    }
    
    void applyViscosity() {
        std::vector<float> newVelocityMap = velocityMap;
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int idx = y * width + x;
                int velIdx = idx * 2;
                
                float vx = velocityMap[velIdx];
                float vy = velocityMap[velIdx + 1];
                
                float laplacianX = 0.0f, laplacianY = 0.0f;
                int count = 0;
                
                if (x > 0) { 
                    laplacianX += velocityMap[velIdx - 2] - vx; 
                    laplacianY += velocityMap[velIdx - 1] - vy; 
                    count++; 
                }
                if (x < width - 1) { 
                    laplacianX += velocityMap[velIdx + 2] - vx; 
                    laplacianY += velocityMap[velIdx + 3] - vy; 
                    count++; 
                }
                if (y > 0) { 
                    laplacianX += velocityMap[velIdx - width * 2] - vx; 
                    laplacianY += velocityMap[velIdx - width * 2 + 1] - vy; 
                    count++; 
                }
                if (y < height - 1) { 
                    laplacianX += velocityMap[velIdx + width * 2] - vx; 
                    laplacianY += velocityMap[velIdx + width * 2 + 1] - vy; 
                    count++; 
                }
                
                if (count > 0) {
                    newVelocityMap[velIdx] = vx + viscosity * laplacianX * dt;
                    newVelocityMap[velIdx + 1] = vy + viscosity * laplacianY * dt;
                }
            }
        }
        
        velocityMap = newVelocityMap;
    }
    
    void applySurfaceTension() {
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int idx = y * width + x;
                int velIdx = idx * 2;
                
                float curvature = 0.0f;
                
                if (x > 0 && x < width - 1) {
                    curvature += heightMap[idx + 1] - 2 * heightMap[idx] + heightMap[idx - 1];
                }
                if (y > 0 && y < height - 1) {
                    curvature += heightMap[idx + width] - 2 * heightMap[idx] + heightMap[idx - width];
                }
                
                velocityMap[velIdx + 1] += surfaceTension * curvature * dt;
            }
        }
    }
};

EMSCRIPTEN_BINDINGS(fluid_simulation) {
    class_<FluidSimulation>("FluidSimulation")
        .constructor<int, int>()
        .function("step", &FluidSimulation::step)
        .function("addForce", &FluidSimulation::addForce)
        .function("setHeight", &FluidSimulation::setHeight)
        .function("getHeight", &FluidSimulation::getHeight)
        .function("getHeightMap", &FluidSimulation::getHeightMap)
        .function("getVelocityMap", &FluidSimulation::getVelocityMap);
} 