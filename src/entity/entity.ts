import { Vec2 } from "../math";


type EntityId = number;

const enum EntityFlags {
    Alive
}



let entityCounter = 0;
const entityIdFreelist: number[] = [];


const entityFlags: number[] = [];
const entityX: number[] = [];
const entityY: number[] = [];

class Entity {
    constructor(public id: EntityId = makeEntity()) {
    }

    free(): void {
        freeEntity(this.id);
    }

    get x(): number {
        return entityX[this.id];
    }
    get y(): number {
        return entityY[this.id];
    }
    get position(): Vec2 {
        return new Vec2(entityX[this.id], entityY[this.id]);
    }
}



function makeEntity(): EntityId {
    let id: EntityId;
    if (entityIdFreelist.length > 0) {
        id = entityIdFreelist.pop();
    } else {
        id = entityCounter++;
    }

    entityFlags[id] = EntityFlags.Alive;
    entityX[id] = 0;
    entityY[id] = 0;

    return id;
}

function freeEntity(id: EntityId): void {
    entityIdFreelist.push(id);
    entityFlags[id] = 0;
}




export {
    Entity,
    EntityId,
    EntityFlags,
    makeEntity,
    freeEntity,
}
