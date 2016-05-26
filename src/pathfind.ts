
type Node = number;


export {
    calcPath,
    makeNeighbourCalc,
}


class BinaryHeap<Value> {
    private heap: Value[] = [];
    
    private isLess: (i: number, j: number) => boolean;
    private setIndex: (value: Value, index: number) => void;
    
    constructor(isValueLess: (a: Value, b: Value) => boolean,
                setIndex?: (value: Value, index: number) => void) {
        this.isLess = function (i, j) { return isValueLess(this.heap[i], this.heap[j]); };
        this.setIndex = setIndex || function () { };
    }
    
    private swap(i: number, j: number): void {
        const temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
        this.setIndex(this.heap[i], i);
        this.setIndex(this.heap[j], j);
    }

    private swapDownward(i: number): void {
        while (true) {
            const child1 = (i * 2) + 1;
            const child2 = (i * 2) + 2;

            if (child1 < this.heap.length && this.isLess(child1, i)) {
                if (child2 < this.heap.length && this.isLess(child2, child1)) {
                    this.swap(i, child2);
                    i = child2;
                } else {
                    this.swap(i, child1);
                    i = child1;
                }
            } else if (child2 < this.heap.length && this.isLess(child2, i)) {
                this.swap(i, child2);
                i = child2;
            } else {
                break;
            }
        }
    }

    swapUpward(i: number): void {
        while (i > 0) {
            const parent = Math.floor((i - 1) / 2);
            if (!this.isLess(i, parent)) {
                break;
            }
            this.swap(i, parent);
            i = parent;
        }
    }

    push(value: Value): void {
        const i = this.heap.length;
        this.setIndex(value, i);
        this.heap.push(value);
        this.swapUpward(i);
    }

    pop(): Value {
        const top = this.heap[0];
        this.setIndex(top, -1);
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.setIndex(last, 0);
            this.swapDownward(0);
        }
        return top;
    }
    
    getCount() {
        return this.heap.length;
    }
}




// construct a path from node "start" to node "curr",
// given an array "parents" which contains the node from which each node was reached during the search
function constructPath(start: Node, curr: Node, parents: Node[]): Node[] {
    const result: Node[] = [];
    while (true) {
        result.push(curr);
        if (curr === start) {
            break;
        }
        curr = parents[curr];
    }
    result.reverse();
    return result;
}


enum NodeState {
    Virgin,
    Open,
    Closed,
}


function calcPath(
    numNodes: number,
    start: Node,
    goal: Node,
    calcDist: (a: Node, b: Node) => number,
    calcNeigh: (node: Node, result: Node[]) => number
): Node[]
{
    // setup the arrays
    const states = [NodeState.Virgin];
    const heuristics = [Number.MAX_VALUE];
    const costs = [Number.MAX_VALUE];
    const parents = [-1]; // from which node did we reach each node
    const heapIndexes = [-1]; // index of each node in the binary heap
    for (let i = 1; i < numNodes; ++i) {
        states.push(NodeState.Virgin);
        heuristics.push(Number.MAX_VALUE);
        costs.push(Number.MAX_VALUE);
        parents.push(-1);
        heapIndexes.push(-1);
    }

    // create a binary heap which we will use to find the
    // unvisited node with the shortest distance from start
    const heap = new BinaryHeap<Node>(
        (a, b) => costs[a] + heuristics[a] < costs[b] + heuristics[b],
        (n, i) => heapIndexes[n] = i
    );

    const neighbours = [0,0,0,0,0,0,0,0];
    states[start] = NodeState.Open;
    heuristics[start] = calcDist(start, goal);
    costs[start] = 0;
    heap.push(start);

    while (heap.getCount() > 0) {
        const curr = heap.pop();
        if (curr === goal) {
            return constructPath(start, curr, parents);
        }

        states[curr] = NodeState.Closed;
        const numNeigh = calcNeigh(curr, neighbours);

        for (let i = 0; i < numNeigh; ++i) {
            const neigh = neighbours[i];
            if (states[neigh] == NodeState.Closed) {
                continue;
            }

            const cost = calcDist(curr, neigh) + costs[curr];

            if (states[neigh] === NodeState.Open) {
                // we've seen this node before, so we must check if this path to it was shorter
                if (cost < costs[neigh]) {
                    costs[neigh] = cost;
                    parents[neigh] = curr;
                    heap.swapUpward(heapIndexes[neigh]);
                }
            } else {
                // we've never seen this node before
                states[neigh] = NodeState.Open;
                heuristics[neigh] = calcDist(neigh, goal);
                costs[neigh] = cost;
                parents[neigh] = curr;
                heap.push(neigh);
            }
        }
    }

    return undefined;
}


// create a function which calculates the neighbours of a given node, in a grid.
// "node" is a 1D index into an array of size "width" x "height" representing the 2D grid
function makeNeighbourCalc(eightDirections: boolean, width: number, height: number, isWalkable: (x: number, y: number) => boolean) {
    // coordinate deltas for children in all 8 directions, starting north
    const diffX = eightDirections ? [ 0, 1, 1, 1, 0,-1,-1,-1] : [ 0,1,0,-1];
    const diffY = eightDirections ? [-1,-1, 0, 1, 1, 1, 0,-1] : [-1,0,1, 0];

    return (node: Node, result: Node[]): number => {
        const nodeX = node % width;
        const nodeY = Math.floor(node / width);
        let resultCount = 0;
        for (let i = 0; i < diffX.length; ++i) {
            const x = nodeX + diffX[i];
            const y = nodeY + diffY[i];
            if (x < 0 || y < 0 || x >= width || y >= height) {
                continue;
            }
            if (!isWalkable(x, y)) {
                continue;
            }
            result[resultCount++] = y * width + x;
        }
        return resultCount;
    };
}
