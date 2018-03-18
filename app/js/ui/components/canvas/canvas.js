import { h, Component } from "preact";
import * as config from "js/shared/config";
import * as helper from "js/shared/helper";
import { Vector } from "js/shared/vector";
import { Node } from "js/shared/node";
import { ControlsEnum } from "js/shared/constants";

export default class Canvas extends Component {
    constructor(props) {
        super(props);
        this.state = {
            mousedown: false,
            selectedNode: null,
            newNodes: [],
            mousePosition: new Vector(0, 0),
            startCoords: new Vector(0, 0),
            lastCoords: new Vector(0, 0),
            transform: {
                translate: new Vector(0, 0),
                scale: new Vector(0, 0)
            }
        };
    }

    componentDidMount() {
        this.interact();
    }

    componentDidUpdate() {
        this.draw();
        if (this.state.selectedNode) {
            this.props.worker.postMessage([
                "move",
                {
                    selectedNode: this.state.selectedNode,
                    mousePosition: this.state.mousePosition
                }
            ]);
        }
    }

    getUniqueID = () => {
        let i = 0;
        let notunique = true;
        while (notunique) {
            if (!this.props.nodes.find(n => n.id === i) && !this.state.newNodes.find(n => n.id === i)) {
                return i;
            }
            i++;
        }
    };

    getMouseScreenPosition = mouseevent => {
        var rect = this.canvas.getBoundingClientRect();
        var mouse = {
            x: mouseevent.clientX - rect.left,
            y: mouseevent.clientY - rect.top
        };
        return new Vector(mouse.x, mouse.y);
    };

    getMouseCanvasPosition = mouseevent => {
        var m = this.getMouseScreenPosition(mouseevent);
        return m.subtract(this.state.transform.translate).divide(this.props.scale);
    };

    getNearestNode = (position, radius, nodes) => {
        let nearestNodes = this.getNearestNodes(position, radius, nodes);
        return nearestNodes.length > 0 ? nearestNodes[0] : null;
    };

    getNearestNodes = (position, radius, nodes) => {
        let nearby = [];
        nodes.forEach(node => {
            let nodePosition = new Vector().load(node.position);
            let distance = nodePosition.subtract(position).length();
            if (distance < radius) {
                nearby.push({ node, distance });
            }
        });
        return nearby
            .sort((a, b) => {
                return a - b;
            })
            .map(n => n.node);
    };

    interact = () => {
        var c = this.canvas;
        var nodes = this.props.nodes;
        const ctx = this.canvas.getContext("2d");
        c.addEventListener(
            "mousedown",
            e => {
                var rect = c.getBoundingClientRect();
                var mousePosition = this.state.mousePosition;
                this.setState({ mousedown: true });
                switch (this.props.selectedControl) {
                    case ControlsEnum.grab:
                        let selectedNode = this.getNearestNode(mousePosition, 20, this.props.nodes);
                        this.setState({
                            selectedNode
                        });
                        break;
                    case ControlsEnum.pan:
                        this.setState({
                            startCoords: this.getMouseScreenPosition(e).subtract(this.state.transform.translate)
                        });
                        break;
                    case ControlsEnum.anchor:
                        this.props.worker.postMessage(["newanchor", { mousePosition }]);
                        break;
                    case ControlsEnum.erase:
                        let nearestNodes = this.getNearestNodes(mousePosition, 5, this.props.nodes);
                        nearestNodes.forEach(node => {
                            this.props.worker.postMessage(["deletenode", { node: node }]);
                        });
                        break;
                    case ControlsEnum.rope:
                        let node = new Node(
                            mousePosition.x,
                            mousePosition.y,
                            0,
                            0,
                            0,
                            0,
                            false,
                            [],
                            this.getUniqueID()
                        );
                        let nearestNode = this.getNearestNode(mousePosition, 5, this.props.nodes);
                        if (nearestNode) {
                            node.connectedNodes.push(nearestNode.id);
                            nearestNode.connectedNodes.push(node.id);
                        }
                        this.setState({
                            startCoords: new Vector(node.position.x, node.position.y),
                            newNodes: [node]
                        });
                        break;
                }
            },
            true
        );
        c.addEventListener(
            "mousemove",
            e => {
                var mouse = this.getMouseScreenPosition(e);
                var mousePosition = this.getMouseCanvasPosition(e);
                this.setState({
                    mousePosition
                });
                switch (this.props.selectedControl) {
                    case ControlsEnum.grab:
                        // Only uses updated mousePosition
                        break;
                    case ControlsEnum.pan:
                        if (this.state.mousedown) {
                            this.setState({
                                transform: {
                                    translate: new Vector(mouse.x, mouse.y).subtract(this.state.startCoords),
                                    scale: this.state.transform.scale
                                }
                            });
                        }
                        break;
                    case ControlsEnum.erase:
                        if (this.state.mousedown) {
                            let nearestNodes = this.getNearestNodes(mousePosition, 5, this.props.nodes);
                            nearestNodes.forEach(node => {
                                this.props.worker.postMessage(["deletenode", { node: node }]);
                            });
                        }
                        break;
                    case ControlsEnum.rope:
                        if (this.state.mousedown) {
                            var distance = this.state.startCoords.subtract(mousePosition).length();
                            if (distance > config.nominalStringLength) {
                                let node = new Node(
                                    mousePosition.x,
                                    mousePosition.y,
                                    0,
                                    0,
                                    0,
                                    0,
                                    false,
                                    [],
                                    this.getUniqueID()
                                );
                                let newNodes = this.state.newNodes;
                                let prevNode = newNodes[newNodes.length - 1];
                                prevNode.connectedNodes.push(node.id);
                                node.connectedNodes.push(prevNode.id);
                                newNodes.push(node);
                                this.setState({
                                    newNodes,
                                    startCoords: new Vector(mousePosition.x, mousePosition.y)
                                });
                            }
                        }
                        break;
                }
            },
            true
        );
        c.addEventListener(
            "mouseup",
            e => {
                var mousePosition = this.state.mousePosition;
                this.setState({ mousedown: false });
                switch (this.props.selectedControl) {
                    case ControlsEnum.grab:
                        if (this.state.selectedNode) {
                            this.props.worker.postMessage(["nomove", { selectedNode: this.state.selectedNode }]);
                        }
                        this.setState({ selectedNode: null });
                        break;
                    case ControlsEnum.pan:
                        this.setState({
                            startCoords: null
                        });
                        break;
                    case ControlsEnum.rope:
                        let node = this.state.newNodes[this.state.newNodes.length - 1];
                        let nodes = this.props.nodes;
                        let nearestNode = this.getNearestNode(mousePosition, 5, nodes);
                        if (nearestNode) {
                            node.connectedNodes.push(nearestNode.id);
                            nodes = this.props.nodes.map(n => {
                                if (n.id === nearestNode.id) {
                                    n.connectedNodes.push(node.id);
                                }
                                return n;
                            });
                        }
                        this.props.worker.postMessage(["addnodes", { nodes: this.state.newNodes }]);
                        this.setState({
                            newNodes: [],
                            nodes: nodes.concat(this.state.newNodes)
                        });
                        break;
                }
            },
            true
        );
        /*
        document.onkeypress = function(e) {
            e = e || window.event;
            console.log(e.keyCode);
        };*/
    };

    draw = () => {
        var showIDs = this.props.options.showIDs;
        // Clear and reset canvas
        const ctx = this.canvas.getContext("2d");
        let nodes = this.props.nodes;
        ctx.strokeStyle = "rgb(0,0,0)";
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
        //ctx.translate(this.canvas.width/2, this.canvas.height/2);
        ctx.setTransform(
            this.props.scale,
            0,
            0,
            this.props.scale,
            this.state.transform.translate.x,
            this.state.transform.translate.y
        );
        //ctx.translate(-this.canvas.width/2, -this.canvas.height/2);

        // Draw grid
        var gridSize = 10 * config.metre;
        var offsetx = (this.state.transform.translate.x / this.props.scale) % gridSize;
        var offsety = (this.state.transform.translate.y / this.props.scale) % gridSize;
        for (let x = 0 - 2 * gridSize; x < this.canvas.width / this.props.scale + gridSize; x = x + gridSize) {
            ctx.beginPath();
            ctx.strokeStyle = "#d0d0d0";
            ctx.moveTo(
                x - this.state.transform.translate.x / this.props.scale + offsetx,
                0 - gridSize - this.state.transform.translate.y / this.props.scale + offsety
            );
            ctx.lineTo(
                x - this.state.transform.translate.x / this.props.scale + offsetx,
                this.canvas.height / this.props.scale -
                    this.state.transform.translate.y / this.props.scale +
                    offsety +
                    gridSize
            );
            ctx.stroke();
        }
        for (let y = 0 - 2 * gridSize; y < this.canvas.height / this.props.scale + gridSize; y = y + gridSize) {
            ctx.beginPath();
            ctx.strokeStyle = "#d0d0d0";
            ctx.moveTo(
                0 - gridSize - this.state.transform.translate.x / this.props.scale + offsetx,
                y - this.state.transform.translate.y / this.props.scale + offsety
            );
            ctx.lineTo(
                this.canvas.width / this.props.scale -
                    this.state.transform.translate.x / this.props.scale +
                    offsetx +
                    gridSize,
                y - this.state.transform.translate.y / this.props.scale + offsety
            );
            ctx.stroke();
        }

        // Draw indicators around cursor if needed
        ctx.strokeStyle = "rgb(0,0,0)";
        if (this.props.selectedControl === ControlsEnum.erase) {
            ctx.beginPath();
            ctx.arc(this.state.mousePosition.x, this.state.mousePosition.y, 5, 0, 2 * Math.PI);
            ctx.stroke();
        }

        // Draw scale bar
        ctx.beginPath();
        ctx.moveTo(10, 100);
        ctx.lineTo(10, 100 + 10 * config.metre);
        ctx.fillText("10m", 11, 100 + 10 * config.metre / 2);
        ctx.stroke();

        // Draw all lines and nodes
        var drawn = [];
        let drawLine = (node, nodes, connectedNodeID) => {
            var nodessss = this.props.nodes;
            var newnodesssss = this.state.newNodes;
            ctx.beginPath();
            if (node.fixed) {
                ctx.fillRect(node.position.x - 2, node.position.y - 2, 5, 5);
            } else {
                ctx.fillRect(node.position.x - 1, node.position.y - 1, 3, 3);
            }
            if (showIDs) {
                ctx.fillText(node.id, node.position.x + 1, node.position.y);
            }
            ctx.stroke();
            if (drawn.indexOf(connectedNodeID.toString() + node.id.toString()) < 0) {
                ctx.beginPath();
                var connectedNode = helper.getNode(connectedNodeID, nodes);
                ctx.moveTo(connectedNode.position.x, connectedNode.position.y);
                ctx.lineTo(node.position.x, node.position.y);
                drawn.push(node.id.toString() + connectedNode.id.toString());
                var force = helper.getForce(node, connectedNode);
                if (force.total >= config.dangerForceMin && force.total < config.dangerForceMax) {
                    var normForce =
                        (force.total - config.dangerForceMin) / (config.dangerForceMax - config.dangerForceMin);
                    var color = normForce * 255;
                    ctx.strokeStyle = "rgb(" + color.toFixed(0) + ", 0, 0)";
                } else if (force.total >= config.dangerForceMax) {
                    ctx.strokeStyle = "rgb(255, 0, 0)";
                } else {
                    ctx.strokeStyle = "rgb(0,0,0)";
                }
                ctx.stroke();
            }
        };
        nodes.concat(this.state.newNodes).forEach(node => {
            if (node.connectedNodes.length <= 0) {
                ctx.beginPath();
                if (node.fixed) {
                    ctx.fillRect(node.position.x - 2, node.position.y - 2, 5, 5);
                } else {
                    ctx.fillRect(node.position.x - 1, node.position.y - 1, 3, 3);
                }
                if (showIDs) {
                    ctx.fillText(node.id, node.position.x + 1, node.position.y);
                }
                ctx.stroke();
            }
            node.connectedNodes.forEach(drawLine.bind(this, node, nodes.concat(this.state.newNodes)));
        });
    };
    render() {
        return (
            <canvas
                ref={canvas => (this.canvas = canvas)}
                id="canvas"
                width={window.innerWidth}
                height={window.innerHeight}
            />
        );
    }
}
