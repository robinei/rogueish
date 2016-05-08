
export class BinaryHeap<Value> {
    private heap: Array<Value> = [];
    
    private is_less: (i: number, j: number) => boolean;
    private set_index: (value: Value, index: number) => void;
    
    constructor(
        is_less: (a: Value, b: Value) => boolean,
        set_index: (value: Value, index: number) => void
    )
    {
        this.is_less = function(i: number, j: number) {
            return is_less(this.heap[i], this.heap[j]);
        };
        this.set_index = set_index;
    }
    
    getArray(): Array<Value> {
        return this.heap;
    }

    private swap(i: number, j: number) {
        const temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
        this.set_index(this.heap[i], i);
        this.set_index(this.heap[j], j);
    }

    private swap_downward(i: number) {
        while (true) {
            const child1 = (i * 2) + 1;
            const child2 = (i * 2) + 2;

            if (child1 < this.heap.length && this.is_less(child1, i)) {
                if (child2 < this.heap.length && this.is_less(child2, child1)) {
                    this.swap(i, child2);
                    i = child2;
                } else {
                    this.swap(i, child1);
                    i = child1;
                }
            } else if (child2 < this.heap.length && this.is_less(child2, i)) {
                this.swap(i, child2);
                i = child2;
            } else {
                break;
            }
        }
    }

    swap_upward(i: number) {
        while (i > 0) {
            const parent = Math.floor((i - 1) / 2);
            if (!this.is_less(i, parent)) {
                break;
            }
            this.swap(i, parent);
            i = parent;
        }
    }

    push(value: Value) {
        const i = this.heap.length;
        this.set_index(value, i);
        this.heap.push(value);
        this.swap_upward(i);
    }

    pop() {
        const top = this.heap[0];
        this.set_index(top, -1);
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.set_index(last, 0);
            this.swap_downward(0);
        }
        return top;
    }

    count() {
        return this.heap.length;
    }
}



type Node = number;


// construct a path from node "start" to node "curr",
// given an array "parents" which contains the node from which each node was reached during the search
export function constructPath(start: Node, curr: Node, parents: Array<Node>): Array<Node> {
    const result: Array<Node> = [];
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


export function calcPath(
    num_nodes: number,
    start: Node,
    goal: Node,
    calc_dist: (a: Node, b: Node) => number,
    calc_neigh: (node: Node, result: Array<Node>) => number
): Array<Node>
{
    // setup the arrays
    const distances: Array<number> = [];
    const visited: Array<boolean> = [];
    const parents: Array<Node> = []; // from which node did we reach each node
    const heap_indexes: Array<number> = []; // index of each node in the binary heap
    for (let i = 0; i < num_nodes; ++i) {
        distances.push(Number.MAX_VALUE);
        visited.push(false);
        parents.push(-1);
        heap_indexes.push(-1);
    }

    // create a binary heap which we will use to find the
    // unvisited node with the shortest distance from start
    function is_less(node1: number, node2: number) {
        return distances[node1] < distances[node2];
    }
    function set_index(node: number, index: number) {
        heap_indexes[node] = index;
    }
    const heap = new BinaryHeap(is_less, set_index);

    const neighbours: number[] = [];
    distances[start] = 0;
    heap.push(start);

    while (heap.count() > 0) {
        const curr = heap.pop();
        if (curr === goal) {
            return constructPath(start, curr, parents);
        }

        visited[curr] = true;
        const num_neigh = calc_neigh(curr, neighbours);

        for (let i = 0; i < num_neigh; ++i) {
            const neigh = neighbours[i];
            if (visited[neigh]) {
                continue;
            }

            const dist = distances[curr] + calc_dist(curr, neigh);

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
                    heap.swap_upward(heap_indexes[neigh]);
                }
            }
        }
    }

    return null;
}


// create a function which calculates the neighbours of a given node, in a grid.
// "node" is a 1D index into an array of size "width" x "height" representing the 2D grid
export function makeNeighbourCalc(width: number, height: number) {
    // coordinate deltas for children in all 8 directions, starting north
    const diff_x = [ 0, 1, 1, 1, 0,-1,-1,-1];
    const diff_y = [-1,-1, 0, 1, 1, 1, 0,-1];

    return function(node: Node, result: Array<Node>): number {
        if (result.length < 8) {
            result.length = 8;
        }

        const node_x = node % width;
        const node_y = Math.floor(node / width);

        let out = 0;
        for (let i = 0; i < 8; ++i) {
            const neigh_x = node_x + diff_x[i];
            const neigh_y = node_y + diff_y[i];
            if (neigh_x < 0 || neigh_y < 0 || neigh_x >= width || neigh_y >= height) {
                continue;
            }

            const neigh = neigh_y*width + neigh_x;
            result[out++] = neigh;
        }
        return out;
    };
}
