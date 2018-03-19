const Vector = require('js/shared/vector').Vector;

var uniqueid = -1;
function getID() {
    uniqueid += 1;
    return uniqueid;
}

class Node {
    constructor(
        x = 0,
        y = 0,
        vx = 0,
        vy = 0,
        fx = 0,
        fy = 0,
        fixed = false,
        connectedNodes = [],
        id
    ) {
        this.id             = !!id || id === 0 ? id : getID();
        this.position       = new Vector(x, y);
        this.velocity       = new Vector(vx, vy);
        this.force          = new Vector(fx, fy);
        this.fixed          = fixed;
        this.connectedNodes = connectedNodes;
        this.grabbed        = false;
    }
    getObject() {
        return {
            id:             this.id,
            position:       this.position,
            velocity:       this.velocity,
            force:          this.force,
            fixed:          this.fixed,
            grabbed:        this.grabbed,
            connectedNodes: this.connectedNodes
        };
    }
    loadObject(nodeObject = {}) {
        this.id             = nodeObject.id || this.id;
        this.position       = nodeObject.position || this.position;
        this.velocity       = nodeObject.velocity || this.velocity;
        this.force          = nodeObject.force || this.force;
        this.fixed          = nodeObject.fixed || this.fixed;
        this.connectedNodes = nodeObject.connectedNodes || this.connectedNodes;
        this.grabbed        = false;
    }
    copy() {
        return new Node(
            this.position.x,
            this.position.y,
            this.velocity.x,
            this.velocity.y,
            this.force.x,
            this.force.y,
            this.fixed,
            this.connectedNodes,
            this.id
        );
    }
}

module.exports = {
    Node
};
