let vc = 0.005; // velocity coefficient

class Particle {
    x; y; vx; vy;
    r; m; count;
    colour;

    constructor(x, y, vx, vy, r, m, colour) {
        this.x = round(x); 
        this.y = round(y); 
        this.vx = round(vx);
        this.vy = round(vy);
        this.r = round(r);
        this.m = round(m);
        this.colour = colour;
        this.count = 0;
    }

    draw() {
        drawDisc(this.x, this.y, this.r, this.colour);
    }

    static drawAll(particles) {
        for (let i = 0; i < particles.length; i++) {
            particles[i].draw();
        }
    }

    move(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    overlapsWithParticle(that) {
        return (this.r + that.r) * (this.r + that.r) > (this.x - that.x) * (this.x - that.x) + (this.y - that.y) * (this.y - that.y);
    }

    timeToHitParticle(that) {
        if (this == that) return Infinity;
        let dx = that.x - this.x;
        let dy = that.y - this.y;
        let dvx = that.vx - this.vx;
        let dvy = that.vy - this.vy;
        let drdv = dx * dvx + dy * dvy;
        if (drdv > 0) return Infinity;
        let dvdv = dvx * dvx + dvy * dvy;
        if (dvdv == 0) return Infinity;
        let drdr = dx * dx + dy * dy;
        let R = this.r + that.r;
        let a = (drdv * drdv) - (dvdv * (drdr - (R * R)));
        if (a <= 0) return Infinity;
        return -(drdv + Math.sqrt(a)) / dvdv;
    }

    timeToHitVerticalWall() {
        if (this.vx > 0) return (1.0 - this.x - this.r) / this.vx;
        else if (this.vx < 0) return (this.r - this.x) / this.vx;
        else return Infinity;
    }

    timeToHitHorizontalWall() {
        if (this.vy > 0) return (1.0 - this.y - this.r) / this.vy;
        else if (this.vy < 0) return (this.r - this.y) / this.vy;
        else return Infinity;
    }

    bounceOffParticle(that) {
        let dx = that.x - this.x;
        let dy = that.y - this.y;
        let dvx = that.vx - this.vx;
        let dvy = that.vy - this.vy;
        let dvdr = dx * dvx + dy * dvy;
        let dist = this.r + that.r;
        let magnitude = 2 * this.m * that.m * dvdr / ((this.m + that.m) * dist);
        let fx = magnitude * dx / dist;
        let fy = magnitude * dy / dist;
        this.vx += fx / this.m;
        this.vx = round(this.vx);
        this.vy += fy / this.m;
        this.vy = round(this.vy); 
        that.vx -= fx / that.m;
        that.vx = round(that.vx); 
        that.vy -= fy / that.m;
        that.vy = round(that.vy);
        this.count++;
        that.count++;
    }

    bounceOffVerticalWall() {
        this.vx = -this.vx;
        this.count++;
    }

    bounceOffHorizontalWall() {
        this.vy = -this.vy;
        this.count++;
    }

    static overlaps(particle, particles) {
        for (let i = 0; i < particles.length; i++) {
            if (particle.overlapsWithParticle(particles[i])) return true;
        }
        return false;
    }

    static getRandomParticle() {
        let r = random(0.005, 0.05);
        let x = random(r, 1 - r);
        let y = random(r, 1 - r);
        let vx = random(-vc, vc);
        let vy = random(-vc, vc);
        let m = random(1, 100);
        let colour = randomColour();
        return new Particle(x, y, vx, vy, r, m, colour);
    }

    static getRandomParticles(amt) {
        let particles = [];
        for (let i = 0; i < amt; i++) {
            let particle;
            let counter = 0;
            while (Particle.overlaps((particle = this.getRandomParticle()), particles)) {
                if (++counter == 100) {
                    console.log("Created 100 overlapping particles! Stopping creation of new particles!");
                    return particles;
                }
            }
            particles.push(particle);
        }
        return particles;
    }
}
