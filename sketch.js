// function _f(x, y) {
//     return x * Math.sin(4 * x) + 1.1 * y * Math.sin(2 * y);
// }

function _f(x, y) {
    return (g.tx - x) * (g.tx - x) + (g.ty - y) * (g.ty - y);
}

// function _f(x, y) {
//     return x + y;
// }

function FF(...args) {
    return _f(...args);
}

function rand(l, u) {
    return (Math.random() * u) + l;
}

function comparator(a, b) {
    if (a.fitness < b.fitness) {
        return -1;
    }
    if (a.fitness > b.fitness) {
        return 1;
    }
    return 0;
}

class Bee {
    constructor() {
        this.flyToRandom();
    }

    _calcFitness() {
        this.fitness = FF(...this.position);
    }

    _preventOutOfBounds() {
        for (let i in this.position) {
            const { min, max } = config.bounds[i];
            if (this.position[i] < min) {
                this.position[i] = min;
            } else if (this.position[i] > max) {
                this.position[i] = max;
            }
        }
    }

    isEqual(bee) {
        if (this.fitness !== bee.fitness) {
            return false;
        }

        for (let i in this.position) {
            if (this.position[i] !== bee.position[i]) {
                return false;
            }
        }

        return true;
    }

    getPosition() {
        return this.position;
    }

    isNotInRange(toCheck) {
        if (toCheck.length === 0) {
            return true;
        }

        for (let bee of toCheck) {
            const pos = bee.position;

            for (let i in this.position) {
                const d = Math.abs(this.position[i] - pos[i]);
                if (d > config.rangeList[i]) {
                    return true;
                }
            }
        }
        return false;
    }

    flyTo(dst) {
        for (let i in this.position) {
            const r = config.rangeList[i];
            this.position[i] = dst[i] + rand(-0.5 * r, 0.5 * r)// * 0.1;
        }
        this._preventOutOfBounds();
        this._calcFitness();
    }

    flyToRandom() {
        this.position = [];
        for (let bound of config.bounds) {
            this.position.push(rand(bound.min, bound.max));
        }
        this._calcFitness();
    }
}

class Hive {
    constructor() {
        this.swarm = [];
        const { scoutCount, selectedBeeCount, selectedCount, bestBeeCount, bestCount } = config;
        const beeCount = scoutCount + selectedBeeCount * selectedCount + bestBeeCount * bestCount;
        for (let i = 0; i < beeCount; ++i) {
            this.swarm.push(new Bee());
        }

        this.bestPlaces = [];
        this.selectedPlaces = [];
        this.swarm.sort(comparator);
        this.bestPosition = this.swarm[0].position;
        this.bestFitness = this.swarm[0].fitness;
    }

    _sendBees(position, index, count) {
        for (let i = 0; i < count; ++i) {
            if (index === this.swarm.length) {
                break;
            }

            const bee = this.swarm[index];

            if (!this.bestPlaces.find(b => bee.isEqual(b)) && !this.selectedPlaces.find(b => bee.isEqual(b))) {
                bee.flyTo(position);
            }

            ++index;
        }
        return index;
    }

    iteration() {
        this.bestPlaces = [this.swarm[0]];
        let ci = 1;

        for (let bee of this.swarm.slice(ci, -1)) {
            if (bee.isNotInRange(this.bestPlaces)) {
                this.bestPlaces.push(bee);
                if (this.bestPlaces.length === config.bestCount) {
                    break;
                }
            }
            ++ci;
        }

        this.selectedPlaces = [];

        for (let bee of this.swarm.slice(ci, -1)) {
            if (bee.isNotInRange(this.bestPlaces) && bee.isNotInRange(this.selectedPlaces)) {
                this.selectedPlaces.push(bee);
                if (this.selectedPlaces.length === config.selectedCount) {
                    break;
                }
            }
        }

        let bi = 1;

        for (let bb of this.bestPlaces) {
            bi = this._sendBees(bb.position, bi, config.bestBeeCount);
        }

        for (let sb of this.selectedPlaces) {
            bi = this._sendBees(sb.position, bi, config.selectedBeeCount);
        }

        for (let b of this.swarm.slice(bi, -1)) {
            b.flyToRandom();
        }

        this.swarm.sort(comparator);
        this.bestPosition = this.swarm[0].position;
        this.bestFitness = this.swarm[0].fitness;
    }

}

let canvasProps;
let config;
let g;

function initChart() {
    return new CanvasJS.Chart("chart-container", {
        title: {
            text: "Accuracy / Iteration"
        },
        axisY: {
            includeZero: false,
            maximum: 1.0,
            minimun: 0.0
        },
        data: [{
            type: "line",
            dataPoints: g.stats
        }]
    });
}

function calcAccuracy() {
    const maxD = canvasProps.w * canvasProps.w + canvasProps.h * canvasProps.h
    return 1.0 - ((g.bestScore) / maxD);
}

function setup() {
    const prod = false;

    canvasProps = {
        w: windowWidth,
        h: prod ? windowHeight : (windowHeight - 300)
    };

    config = {
        bounds: [
            { min: 0.0, max: canvasProps.w },
            { min: 0.0, max: canvasProps.h }
        ],
        scoutCount: 20,
        selectedBeeCount: 10,
        bestBeeCount: 5,
        selectedCount: 5,
        bestCount: 2,
        rangeList: [5, 5]
    }

    g = {
        hive: {},
        tx: rand(0, canvasProps.w),
        ty: rand(0, canvasProps.h),
        iCnt: 0,
        stats: [],
        bestScore: 1e10,
        chart: null,
        prod
    }

    if (g.prod) {
        document.getElementById("chart-container").remove();
        canvasProps.h = windowHeight;
    }

    createCanvas(canvasProps.w, canvasProps.h);
    background(0);
    noStroke();
    // frameRate(10);

    g.hive = new Hive();
    g.chart = initChart();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    background(0);

    if (!g.prod) {
        fill('red');
        ellipse(g.tx, g.ty, 30, 30);
    }

    fill(60);
    g.hive.iteration();
    for (let bee of g.hive.swarm) {
        const p = bee.position;
        fill(255);
        ellipse(p[0], p[1], 5, 5);
    }

    const best = g.hive.swarm[0];
    fill('blue');
    ellipse(best.position[0], best.position[1], 10, 10);

    ++g.iCnt;
    if (!g.prod) {
        for (const b of g.hive.swarm) {
            if (b.fitness < g.bestScore) {
                g.bestScore = b.fitness;
            }
        }
        g.bestScore = Math.round(g.bestScore * 100) / 100;
        g.stats.push({
            x: g.iCnt,
            y: calcAccuracy()
        });
        g.chart.render();

        textSize(32);
        fill(255);
        text(`D: ${g.bestScore}\nN: ${g.iCnt}`, 10, 30);
    } else {
        textSize(32);
        fill(255);
        text(`N: ${g.iCnt}`, 10, 30);
    }
}

new p5(sketch, "sketch-container");