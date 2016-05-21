
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
    const distances: number[] = [];
    const visited: boolean[] = [];
    const parents: Node[] = []; // from which node did we reach each node
    const heapIndexes: number[] = []; // index of each node in the binary heap
    for (let i = 0; i < numNodes; ++i) {
        distances.push(Number.MAX_VALUE);
        visited.push(false);
        parents.push(-1);
        heapIndexes.push(-1);
    }

    // create a binary heap which we will use to find the
    // unvisited node with the shortest distance from start
    function isLess(node1: number, node2: number) {
        return distances[node1] < distances[node2];
    }
    function setIndex(node: number, index: number) {
        heapIndexes[node] = index;
    }
    const heap = makeBinaryHeap(isLess, setIndex);

    const neighbours: number[] = [];
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

    return null;
}


// create a function which calculates the neighbours of a given node, in a grid.
// "node" is a 1D index into an array of size "width" x "height" representing the 2D grid
function makeNeighbourCalc(width: number, height: number) {
    // coordinate deltas for children in all 8 directions, starting north
    const diffX = [ 0, 1, 1, 1, 0,-1,-1,-1];
    const diffY = [-1,-1, 0, 1, 1, 1, 0,-1];

    return (node: Node, result: Node[]): number => {
        if (result.length < 8) {
            result.length = 8;
        }

        const nodeX = node % width;
        const nodeY = Math.floor(node / width);

        let out = 0;
        for (let i = 0; i < 8; ++i) {
            const neighX = nodeX + diffX[i];
            const neighY = nodeY + diffY[i];
            if (neighX < 0 || neighY < 0 || neighX >= width || neighY >= height) {
                continue;
            }

            const neigh = neighY*width + neighX;
            result[out++] = neigh;
        }
        return out;
    };
}
