import { Vec2 } from "../math";
import { Direction, dirDX, dirDY } from "../direction";
import { Map } from "../map";


type EntityId = number;

const enum EntityFlags {
    Alive = 1,
    Immortal = 2,
}



let entityCounter = 0;
const entityIdFreelist: number[] = [];


const entityFlags: number[] = [];
const entityX: number[] = [];
const entityY: number[] = [];
const entityMap: Map[] = [];

class Entity {
    constructor(public id: EntityId = makeEntity()) {
        if (id >= entityFlags.length) {
            throw new Error("bad entity id");
        }
        if ((entityFlags[id] & EntityFlags.Alive) === 0) {
            throw new Error("entity is not alive");
        }
    }

    free(): void {
        freeEntity(this.id);
    }

    move(dir: Direction): void {
        moveEntity(this.id, dir);
    }

    get x(): number {
        return entityX[this.id];
    }
    set x(val: number) {
        entityX[this.id] = val;
    }
    get y(): number {
        return entityY[this.id];
    }
    set y(val: number) {
        entityY[this.id] = val;
    }
    get position(): Vec2 {
        return new Vec2(entityX[this.id], entityY[this.id]);
    }
    set position(pos: Vec2) {
        entityX[this.id] = pos.x;
        entityY[this.id] = pos.y;
    }
    get map(): Map {
        return entityMap[this.id];
    }
    set map(map: Map) {
        entityMap[this.id] = map;
    }
}


function makeEntity(flags: number = 0): EntityId {
    let id: EntityId;
    if (entityIdFreelist.length > 0) {
        id = entityIdFreelist.pop() || entityCounter++;
    } else {
        id = entityCounter++;
    }

    entityFlags[id] = flags | EntityFlags.Alive;
    entityX[id] = 0;
    entityY[id] = 0;

    return id;
}


function freeEntity(id: EntityId): void {
    if (id >= entityFlags.length) {
        throw new Error("bad entity id");
    }
    if ((entityFlags[id] & EntityFlags.Alive) === 0) {
        throw new Error("entity is not alive");
    }
    if ((entityFlags[id] & EntityFlags.Immortal) !== 0) {
        throw new Error("can't free immortal entity");
    }
    entityIdFreelist.push(id);
    entityFlags[id] = 0;
}


function moveEntity(id: EntityId, dir: Direction): void {
    const map = entityMap[id];
    if (!map) {
        throw new Error("entity is not on a map");
    }
    const x = entityX[id];
    const y = entityY[id];
    const newX = x + dirDX[dir];
    const newY = y + dirDY[dir];
    if (!map.isWalkable(newX, newY)) {
        return;
    }
    entityX[id] = newX;
    entityY[id] = newY;
}




export {
    Entity,
    EntityId,
    EntityFlags,
    makeEntity,
    freeEntity,
    moveEntity,
};
