
type Node = number;


export {
    calcPath,
    makeNeighbourCalc,
}


interface BinaryHeap<Value> {
    getCount(): number;
    push(value: Value): void;
    pop(): Value;
    swapUpward(i: number): void;
}


function makeBinaryHeap<Value>(
    isValueLess: (a: Value, b: Value) => boolean,
    setIndex: (value: Value, index: number) => void
): BinaryHeap<Value>
{
    const heap: Value[] = [];
    
    function isLess(i: number, j: number) {
        return isValueLess(heap[i], heap[j]);
    }
    
    function swap(i: number, j: number) {
        const temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
        setIndex(heap[i], i);
        setIndex(heap[j], j);
    }

    function swapDownward(i: number) {
        while (true) {
            const child1 = (i * 2) + 1;
            const child2 = (i * 2) + 2;

            if (child1 < heap.length && isLess(child1, i)) {
                if (child2 < heap.length && isLess(child2, child1)) {
                    swap(i, child2);
                    i = child2;
                } else {
                    swap(i, child1);
                    i = child1;
                }
            } else if (child2 < heap.length && isLess(child2, i)) {
                swap(i, child2);
                i = child2;
            } else {
                break;
            }
        }
    }

    function swapUpward(i: number) {
        while (i > 0) {
            const parent = Math.floor((i - 1) / 2);
            if (!isLess(i, parent)) {
                break;
            }
            swap(i, parent);
            i = parent;
        }
    }

    function push(value: Value) {
        const i = heap.length;
        setIndex(value, i);
        heap.push(value);
        swapUpward(i);
    }

    function pop() {
        const top = heap[0];
        setIndex(top, -1);
        const last = heap.pop();
        if (heap.length > 0) {
            heap[0] = last;
            setIndex(last, 0);
            swapDownward(0);
        }
        return top;
    }
    
    return {
        getCount: () => heap.length,
        push,
        pop,
        swapUpward,
    };
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


function calcPath(
    numNodes: number,
    start: Node,
    goal: Node,
    calcDist: (a: Node, b: Node) => number,
    calcNeigh: (node: Node, result: Node[]) => number
): Node[]
{
    // setup the arrays
    const distances = [Number.MAX_VALUE];
    const visited = [false];
    const parents = [-1]; // from which node did we reach each node
    const heapIndexes = [-1]; // index of each node in the binary heap
    for (let i = 1; i < numNodes; ++i) {
        distances.push(Number.MAX_VALUE);
        visited.push(false);
        parents.push(-1);
        heapIndexes.push(-1);
    }

    // create a binary heap which we will use to find the
    // unvisited node with the shortest distance from start
    const heap = makeBinaryHeap<Node>(
        (a, b) => distances[a] < distances[b],
        (n, i) => heapIndexes[n] = i
    );

    const neighbours = [0,0,0,0,0,0,0,0];
    distances[start] = 0;
    heap.push(start);

    while (heap.getCount() > 0) {
        const curr = heap.pop();
        if (curr === goal) {
            return constructPath(start, curr, parents);
        }

        visited[curr] = true;
        const numNeigh = calcNeigh(curr, neighbours);

        for (let i = 0; i < numNeigh; ++i) {
            const neigh = neighbours[i];
            if (visited[neigh]) {
                continue;
            }

            const dist = distances[curr] + calcDist(curr, neigh);

            if (distances[neigh] === Number.MAX_VALUE) {
                // we've never seen this node before
                distances[neigh] = dist;
                parents[neigh] = curr;
                heap.push(neigh);
            } else {
                // we've seen this node before, so we must check if this path to it was shorter
                if (dist < distances[neigh]) {
                    distances[neigh] = dist;
                    parents[neigh] = curr;
                    heap.swapUpward(heapIndexes[neigh]);
                }
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
