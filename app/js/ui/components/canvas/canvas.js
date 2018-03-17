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
            mousePosition: { x: 0, y: 0 },
            startCoords: { x: 0, y: 0 },
            lastCoords: { x: 0, y: 0 },
            transformed: { x: 0, y: 0 }
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
        while(notunique) {
            if (!this.props.nodes.find(n=>n.id === i) && !this.state.newNodes.find(n=>n.id === i)) {
                return i;
            }
            i++;
        }
    }
    interact = () => {
        var c = this.canvas;
        var nodes = this.props.nodes;
        const ctx = this.canvas.getContext("2d");
        c.addEventListener(
            "mousedown",
            e => {
                var rect = c.getBoundingClientRect();
                var mouse = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
                var transformedV = new Vector().load(this.state.transformed);
                var m = new Vector(mouse.x, mouse.y);
                var mousePosition = m.subtract(transformedV).divide(this.props.scale);
                if (this.props.selectedControl === ControlsEnum.grab) {
                    var nodes = this.props.nodes;
                    var min = 20;
                    var selected;
                    for (var i = 0; i < nodes.length; i++) {
                        nodes[i].position = new Vector().load(
                            nodes[i].position
                        );
                        var distance = nodes[i].position
                            .subtract(m.subtract(transformedV).divide(this.props.scale))
                            .length();
                        if (!min || distance < min) {
                            selected = nodes[i];
                            min = distance;
                        }
                    }
                    this.setState({
                        mousePosition
                    });
                    if (selected) {
                        this.setState({
                            selectedNode: selected
                        });
                    }
                } else if (this.props.selectedControl === ControlsEnum.pan) {
                    this.setState({
                        startCoords: {
                            x: e.pageX - rect.left - this.state.lastCoords.x,
                            y: e.pageY - rect.top - this.state.lastCoords.y
                        }
                    });
                } else if (this.props.selectedControl === ControlsEnum.anchor) {
                    this.props.worker.postMessage([
                        "newanchor",
                        { mousePosition }
                    ]);
                } else if (this.props.selectedControl === ControlsEnum.erase) {
                    var nodes = this.props.nodes;
                    var min = 5;
                    for (var i = 0; i < nodes.length; i++) {
                        nodes[i].position = new Vector().load(
                            nodes[i].position
                        );
                        var distance = nodes[i].position
                            .subtract(m.subtract(transformedV).divide(this.props.scale))
                            .length();
                        if (distance < min) {
                            this.props.worker.postMessage([
                                "deletenode",
                                { node: nodes[i] }
                            ]);
                        }
                    }
                    this.setState({
                        mousePosition: m.subtract(transformedV)
                    });
                } else if (this.props.selectedControl === ControlsEnum.rope) {
                    let node = new Node(mousePosition.x, mousePosition.y,0,0,0,0,false,[],this.getUniqueID())
                    var nodes = this.props.nodes;
                    var min = 5;
                    for (var i = 0; i < nodes.length; i++) {
                        nodes[i].position = new Vector().load(
                            nodes[i].position
                        );
                        var distance = nodes[i].position
                            .subtract(mousePosition)
                            .length();
                        if (distance < min) {
                            node.connectedNodes.push(nodes[i].id);
                            nodes[i].connectedNodes.push(node.id);
                        }
                    }
                    this.setState({
                        startCoords: {
                            x: node.position.x,
                            y: node.position.y
                        },
                        newNodes: [node]
                    });
                }
                this.setState({ mousedown: true });
            },
            true
        );
        c.addEventListener(
            "mousemove",
            e => {
                var rect = c.getBoundingClientRect();
                var mouse = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
                var transformedV = new Vector().load(this.state.transformed);
                var mousePosition = new Vector(mouse.x, mouse.y).subtract(
                    transformedV
                ).divide(this.props.scale);
                this.setState({
                    mousePosition
                });
                if (this.props.selectedControl === ControlsEnum.grab) {
                    this.setState({
                        mousePosition
                    });
                } else if (this.props.selectedControl === ControlsEnum.pan) {
                    if (this.state.mousedown) {
                        this.setState({
                            transformed: {
                                x: mouse.x - this.state.startCoords.x,
                                y: mouse.y - this.state.startCoords.y
                            }
                        });
                    }
                } else if (this.props.selectedControl === ControlsEnum.erase) {
                    if (this.state.mousedown) {
                        var nodes = this.props.nodes;
                        var min = 5;
                        for (var i = 0; i < nodes.length; i++) {
                            nodes[i].position = new Vector().load(
                                nodes[i].position
                            );
                            var distance = nodes[i].position
                                .subtract(mousePosition)
                                .length();
                            if (distance < min) {
                                this.props.worker.postMessage([
                                    "deletenode",
                                    { node: nodes[i] }
                                ]);
                            }
                        }
                    }
                } else if (this.props.selectedControl === ControlsEnum.rope) {
                    if (this.state.mousedown) {
                        let startCoordsV = new Vector().load(this.state.startCoords);
                        var distance = startCoordsV.subtract(mousePosition).length();
                        if (distance > config.nominalStringLength) {
                            let node = new Node(mousePosition.x, mousePosition.y,0,0,0,0,false,[],this.getUniqueID());
                            let newNodes = this.state.newNodes;
                            let prevNode = newNodes[newNodes.length - 1];
                            prevNode.connectedNodes.push(node.id);
                            node.connectedNodes.push(prevNode.id);
                            newNodes.push(node);
                            this.setState({
                                newNodes,
                                startCoords: {
                                    x: mousePosition.x,
                                    y: mousePosition.y
                                }
                            })

                        }
                    }
                }
            },
            true
        );
        c.addEventListener(
            "mouseup",
            e => {
                var rect = c.getBoundingClientRect();
                var mouse = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
                var transformedV = new Vector().load(this.state.transformed);
                var m = new Vector(mouse.x, mouse.y);
                var mousePosition = m.subtract(transformedV).divide(this.props.scale);
                if (this.props.selectedControl === ControlsEnum.grab) {
                    if (this.state.selectedNode) {
                        this.props.worker.postMessage([
                            "nomove",
                            { selectedNode: this.state.selectedNode }
                        ]);
                    }
                    this.setState({ selectedNode: null });
                } else if (this.props.selectedControl === ControlsEnum.pan) {
                    var rect = c.getBoundingClientRect();
                    this.setState({
                        lastCoords: {
                            x: e.pageX - rect.left - this.state.startCoords.x,
                            y: e.pageY - rect.top - this.state.startCoords.y
                        },
                        startCoords: null
                    });
                } else if (this.props.selectedControl === ControlsEnum.rope) {
                    let node = this.state.newNodes[this.state.newNodes.length - 1]
                    var nodes = this.props.nodes;
                    var min = 5;
                    for (var i = 0; i < nodes.length; i++) {
                        nodes[i].position = new Vector().load(
                            nodes[i].position
                        );
                        var distance = nodes[i].position
                            .subtract(mousePosition)
                            .length();
                        if (distance < min) {
                            node.connectedNodes.push(nodes[i].id);
                            nodes[i].connectedNodes.push(node.id);
                        }
                    }
                    this.props.worker.postMessage(["addnodes", {nodes: this.state.newNodes}])
                    this.setState({
                        newNodes: [],
                        nodes: nodes.concat(this.state.newNodes)
                    })
                }
                this.setState({ mousedown: false });
            },
            true
        );
        window.addEventListener('scroll', e => {
            console.log(window.scrollY)
        })
        document.onkeypress = function (e) {
            e = e || window.event;
            console.log(e.keyCode)
        };
    };

    draw = () => {
        var showIDs = this.props.options.showIDs;
        // Clear and reset canvas
        const ctx = this.canvas.getContext("2d");
        let nodes = this.props.nodes;
        ctx.strokeStyle = "rgb(0,0,0)";
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0, this.canvas.width,
        this.canvas.height)
        ctx.restore();
        ctx.setTransform(
            this.props.scale,
            0,
            0,
            this.props.scale,
            this.state.transformed.x,
            this.state.transformed.y
        );

        // Draw grid
        var gridSize = 10 * config.metre;
        var offsetx = (this.state.transformed.x / this.props.scale ) % gridSize;
        var offsety = (this.state.transformed.y / this.props.scale) % gridSize;
        for (let x = 0 - 2*gridSize; x < (this.canvas.width /  this.props.scale) + gridSize; x = x + gridSize) {
            ctx.beginPath();
            ctx.strokeStyle = "#d0d0d0"
            ctx.moveTo(x - (this.state.transformed.x / this.props.scale ) + offsetx, 0 - gridSize - (this.state.transformed.y / this.props.scale) + offsety);
            ctx.lineTo(x - (this.state.transformed.x / this.props.scale ) + offsetx,  (this.canvas.height /  this.props.scale) - (this.state.transformed.y / this.props.scale) + offsety + gridSize);
            ctx.stroke()
        }
        for (let y = 0 - 2*gridSize; y < (this.canvas.height /  this.props.scale) + gridSize; y = y + gridSize) {
            ctx.beginPath();
            ctx.strokeStyle = "#d0d0d0"
            ctx.moveTo(0 - gridSize - (this.state.transformed.x / this.props.scale ) + offsetx, y - (this.state.transformed.y / this.props.scale) + offsety);
            ctx.lineTo((this.canvas.width /  this.props.scale) - (this.state.transformed.x / this.props.scale ) + offsetx + gridSize,y -  (this.state.transformed.y / this.props.scale) + offsety);
            ctx.stroke()
        }

        // Draw indicators around cursor if needed
        ctx.strokeStyle = "rgb(0,0,0)";
        if (this.props.selectedControl === ControlsEnum.erase) {
            ctx.beginPath();
            ctx.arc(
                this.state.mousePosition.x,
                this.state.mousePosition.y,
                5,
                0,
                2 * Math.PI
            );
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
            var nodessss = this.props.nodes
            var newnodesssss = this.state.newNodes
            ctx.beginPath();
            if (node.fixed) {
                ctx.fillRect(node.position.x - 2, node.position.y - 2, 5, 5);
            } else {
                ctx.fillRect(node.position.x - 1, node.position.y - 1, 3, 3);
            }            if (showIDs) {
                ctx.fillText(node.id, node.position.x + 1, node.position.y);
            }
            ctx.stroke();
            if (
                drawn.indexOf(connectedNodeID.toString() + node.id.toString()) <
                0
            ) {
                ctx.beginPath();
                var connectedNode = helper.getNode(connectedNodeID, nodes);
                ctx.moveTo(connectedNode.position.x, connectedNode.position.y);
                ctx.lineTo(node.position.x, node.position.y);
                drawn.push(node.id.toString() + connectedNode.id.toString());
                var force = helper.getForce(node, connectedNode);
                if (
                    force.total >= config.dangerForceMin &&
                    force.total < config.dangerForceMax
                ) {
                    var normForce =
                        (force.total - config.dangerForceMin) /
                        (config.dangerForceMax - config.dangerForceMin);
                    var color = normForce * 255;
                    ctx.strokeStyle = "rgb(" + color.toFixed(0) + ", 0, 0)";
                } else if (force.total >= config.dangerForceMax) {
                    ctx.strokeStyle = "rgb(255, 0, 0)";
                } else {
                    ctx.strokeStyle = "rgb(0,0,0)";
                }
                ctx.stroke();
            }
        }
        nodes.concat(this.state.newNodes).forEach((node) => {
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
