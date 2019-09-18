// function _f(x, y) {
//     return x * Math.sin(4 * x) + 1.1 * y * Math.sin(2 * y);
// }

function _f(x, y) {
    return (globals.tx - x) * (globals.tx - x) + (globals.ty - y) * (globals.ty - y);
}

function FF(...args) {
    return _f(...args);
}

function isMoreOptimal(a, b) {
    return a < b;
}

function rand(l, u) {
    return (Math.random() * u) + l;
}

class Bee {
    constructor() {
        this.w = globals.w;
        this.v = [0.01, 0.01];
        this.pos = [
            rand(globals.bound[0].min, globals.bound[0].max),
            rand(globals.bound[1].min, globals.bound[1].max)
        ];
        this.c1 = globals.c1;
        this.c2 = globals.c2;

        this.pbp = Array.from(this.pos);
    }

    _move() {
        for (let i = 0; i < this.pos.length; i++) {
            this.pos[i] += this.v[i];
            if (this.pos[i] < globals.bound[i].min || this.pos[i] > globals.bound[i].max) {
                this.pos[i] = rand(globals.bound[i].min, globals.bound[i].max)
            }
        }
    }

    _updateVelocity() {
        for (let i = 0; i < this.pos.length; i++) {
            this.v[i] =
                (this.w * this.v[i]) +
                (this.c1 * (this.pbp[i] - this.pos[i])) +
                (this.c2 * (globals.gbp[i] - this.pos[i]));

            if (this.v[i] > 10) {
                this.v[i] = 0.1;
            }

            this.v[i] += rand(-0.1, 0.1);
        }
    }

    _updateBP() {
        const newVal = FF(...this.pos);
        const oldVal = FF(...this.pbp);
        const globalVal = FF(...globals.gbp);
        if (isMoreOptimal(newVal, oldVal)) {
            this.pbp = Array.from(this.pos);
        }

        if (isMoreOptimal(newVal, globalVal)) {
            globals.gbp = Array.from(this.pos);
        }
    }

    iteration() {
        this._updateVelocity();
        this._move();
        this._updateBP();
    }
}

const canvasProps = {
    w: 900,
    h: 900
};

const globals = {
    populationSize: 100,
    bound: [{ min: 0.0, max: canvasProps.w }, { min: 0.0, max: canvasProps.h }],
    gbp: [],
    population: [],
    cnt: 0,
    tx: rand(0, canvasProps.w),
    ty: rand(0, canvasProps.h),
    showTarget: true,
    w: 0.3,
    c1: 0.1,
    c2: 0.001
};

function initSimulation() {
    globals.population = [];
    for (let i = 0; i < globals.populationSize; i++) {
        globals.population.push(new Bee());
    }
    let optV = FF(globals.population[0].pos);
    let optI = 0
    globals.population.forEach((bee, index) => {
        const cur = FF(bee.pos);
        if (isMoreOptimal(cur, optV)) {
            optV = cur;
            optI = index;
        }
    });
    globals.gbp = Array.from(globals.population[optI].pos);
}

function setup() {
    createCanvas(canvasProps.w, canvasProps.h);
    background(0);
    noStroke();
    document.oncontextmenu = function () {
        return false;
    }
    // frameRate(5);
    initSimulation();
}

function moveTarget() {
    if (mouseIsPressed) {
        if (mouseButton === LEFT) {
            globals.tx = mouseX;
            globals.ty = mouseY;
        }
        else if (mouseButton === RIGHT) {
            initSimulation();
        }
    }
}

function draw() {
    background(0);
    if (globals.showTarget) {
        fill('red');
        ellipse(globals.tx, globals.ty, 30, 30);
        fill(60);
    }

    ellipse(globals.gbp[0], globals.gbp[1], 20, 20);
    moveTarget();

    globals.population.forEach(bee => {
        bee.iteration();
    });

    globals.population.map(bee => bee.pos).forEach(pos => {
        fill(255);
        ellipse(pos[0], pos[1], 5, 5);
    });
}