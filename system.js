// Minimum priority Queue for Event prioritized by time
class EventPQ {
    pq;
    constructor() {
        this.pq = [];
        this.pq.push(null);
    }
    isEmpty() { return this.pq.length == 1; }
    size() { return this.pq.length - 1; }
    great(i, j) { return this.pq[i].time > this.pq[j].time; }
    exch(i, j) {
        let temp = this.pq[i];
        this.pq[i] = this.pq[j];
        this.pq[j] = temp;
    }
    swim(k) {
        while (k > 1 && this.great(Math.floor(k / 2), k)) {
            this.exch(k, Math.floor(k / 2));
            k = Math.floor(k / 2);
        }
    }
    sink(k) {
        while (2 * k <= this.pq.length - 1) {
            let j = 2 * k;
            if (j < this.pq.length - 1 && this.great(j, j + 1)) {
                j++;
            }
            if (!this.great(k, j)) break;
            this.exch(k, j);
            k = j;
        }
    }
    insert(key) {
        this.pq.push(key);
        this.swim(this.pq.length - 1);
    }
    delMin() {
        let min = this.pq[1];
        this.exch(1, this.pq.length - 1);
        this.pq.pop();
        this.sink(1);
        return min;
    } 
}

class Event {
    time;
    a; b;   // objcts involved in event
    // [Particle, Particle]: collision between particles
    // [Particle, null]: collision with Vertical Wall
    // [null, Particle]: collision with Horizontal Wall
    // [null, null]: redraw 
    countA; // number of collision A has gone through at time of predicting this event
    countB; // number of collision B has gone through at time of predicting this event

    constructor(t, a, b) {
        this.time = t;
        this.a = a;
        this.b = b;
        if (a != null) this.countA = a.count;
        else this.countA = -1;
        if (b != null) this.countB = b.count;
        else this.countB = -1;
    }

    // a predicted event is valid if involved particles have not gone through
    // any other collision since this event was predicted
    isValid() {
        if (this.a != null && this.a.count != this.countA) return false;
        if (this.b != null && this.b.count != this.countB) return false;
        return true;
    }
}

class CollisionSystem {
    redrawFactor;   // number of redraws per unit time
    eventHeap;      // binary heap of events
    time;           // current time of the collision system
    particles;      // particles in this system
    maxTime;        // stop after reaching maxTime
    constructor(particles, maxTime) {
        this.particles = particles;
        this.eventHeap = new EventPQ();
        this.time = 0;
        this.redrawFactor = 1;
        this.maxTime = maxTime;
        this.init();
    }

    init() {
        for (let i = 0; i < this.particles.length; i++) {
            this.predict(this.particles[i]);
        }
        this.eventHeap.insert(new Event(0, null, null));
    }

    predict(a) {
        if (a == null) return;
        for (let i = 0; i < this.particles.length; i++) {
            let dt = a.timeToHitParticle(this.particles[i]);
            if (dt < 0) {
                console.log("-ve time to hit(" + dt + "), Probably overlapping particles: ")
                log(a);
                log(this.particles[i]);
                // paused = true;
            }
            if (this.time + dt <= this.maxTime) {
                this.eventHeap.insert(new Event(this.time + dt, a, this.particles[i]));
            }
        }

        let dtX = a.timeToHitVerticalWall();
        let dtY = a.timeToHitHorizontalWall();
        if (this.time + dtX <= this.maxTime) this.eventHeap.insert(new Event(this.time + dtX, a, null));
        if (this.time + dtY <= this.maxTime) this.eventHeap.insert(new Event(this.time + dtY, null, a));
    }

    redraw() {
        ctx.clearRect(0, 0, canvasDim, canvasDim);
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].draw();
        }
        let nextRedraw = this.time + 1.0 / this.redrawFactor;
        if (nextRedraw <= this.maxTime)
            this.eventHeap.insert(new Event(nextRedraw, null, null));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, canvasDim);
        ctx.lineTo(canvasDim, canvasDim);
        ctx.lineTo(canvasDim, 0);
        ctx.lineTo(0, 0);
        ctx.strokeStyle = colours[3];
        ctx.stroke();
    }
}


function simulate() {
    while (collisionSystem.time <= collisionSystem.maxTime && !collisionSystem.eventHeap.isEmpty()) {
        let e = collisionSystem.eventHeap.delMin();
        if (!e.isValid()) continue;
        for (let i = 0; i < collisionSystem.particles.length; i++) {
            collisionSystem.particles[i].move(e.time - collisionSystem.time);
        }
        collisionSystem.time = e.time;
        if (e.a != null && e.b != null) e.a.bounceOffParticle(e.b);
        else if (e.a != null && e.b == null) e.a.bounceOffVerticalWall();
        else if (e.a == null && e.b != null) e.b.bounceOffHorizontalWall();
        else {
            collisionSystem.redraw();
            collisionSystem.predict(e.a);
            collisionSystem.predict(e.b);
            break;
        }
        collisionSystem.predict(e.a);
        collisionSystem.predict(e.b);
    }
    if (collisionSystem.time > collisionSystem.maxTime) paused = true;
    if (!paused)
        reqID = requestAnimationFrame(simulate);
}


// Setup classes
// Setup for brownian motion
class Brownian {
    particles;
    constructor(n, r, m) {
        let smallRadius = Math.sqrt(0.02 / n);
        this.particles = [];
        this.particles.push(new Particle(0.5, 0.5, 0, 0, r * smallRadius, m, colours[2]));
        for (let i = 0; i < n; i++) {
            let particle;
            let counter = 0;
            while (Particle.overlaps((particle = Brownian.getRandomParticle(smallRadius, 1, colours[1])), this.particles)) {
                if (++counter == 100) {
                    console.log("Cannot create " + n + " particles");
                    return;
                }
            }
            this.particles.push(particle);
        }
    }

    static getRandomParticle(radius, mass, colour) {
        let x = random(radius, 1 - radius);
        let y = random(radius, 1 - radius);
        let vx = random(-vc, vc);
        let vy = random(-vc, vc);
        return new Particle(x, y, vx, vy, radius, mass, colour);
    }

    getParticles() {
        return this.particles;
    }
}

// Setup for diffusion through a slit
class Diffusion {
    particles;
    static wallN = 15;
    static wr;
    // n ->  number of particles
    // gap ->  Integer belonging to [0 - wallN]
    constructor(n, gap) {
        if (gap < 0 || gap > this.wallN)
            console.log("error: gap!")
        this.particles = []
        // create the wall:
        Diffusion.wr = 1.0 / (2 * Diffusion.wallN * 2);
        for (let i = 0; i < Diffusion.wallN - gap; i++) {
            let p = new Particle(0.5, Diffusion.wr + i * 2 * Diffusion.wr, 0, 0, Diffusion.wr, 10000000000, colours[2]);
            this.particles.push(p);
        }
        for (let i = Diffusion.wallN + gap; i < Diffusion.wallN * 2; i++) {
            let p = new Particle(0.5, Diffusion.wr + i * 2 * Diffusion.wr, 0, 0, Diffusion.wr, 10000000000, colours[2]);
            this.particles.push(p);
        }
        let r = Math.sqrt(0.01 / n);
        // creating the particles:
        for (let i = 0; i < n; i++) {
            let particle;
            let counter = 0;
            while (Particle.overlaps((particle = Diffusion.getRandomParticle(r, 0.1, colours[1])), this.particles)) {
                if (++counter == 100) {
                    console.log("Cannot create " + n + " particles");
                    return;
                }
            }
            this.particles.push(particle);
        }

    }

    static getRandomParticle(radius, mass, colour) {
        let x = random(radius, 0.5 - radius - Diffusion.wr);
        let y = random(radius, 1 - radius);
        let vx = random(-vc, vc);
        let vy = random(-vc, vc);
        return new Particle(x, y, vx, vy, radius, mass, colour);
    }

    getParticles() {
        return this.particles;
    }
}