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
            transform: {
                translate: new Vector(0, 0),
                scale: new Vector(1, 1)
            },
            hightlightNodeID: null
        };
    }

    componentDidMount() {
        this.setupInteractions();
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

    getMouseScreenPosition = event => {
        let rect = this.canvas.getBoundingClientRect();
        if (event.type.includes('touch')) {
            return new Vector(event.touches[0].clientX - rect.left, event.touches[0].clientY - rect.top);
        } else {
            return new Vector(event.clientX - rect.left, event.clientY - rect.top);
        }
    };

    getMouseCanvasPosition = event => {
        var m = this.getMouseScreenPosition(event);
        return m.subtract(this.state.transform.translate).divide(this.state.transform.scale);
    };

    updateMousePosition = event => {
        var mousePosition = this.getMouseCanvasPosition(event);
        this.setState({
            mousePosition
        });
    }

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
                return a.distance - b.distance;
            })
            .map(n => n.node);
    };

    setupInteractions = () => {
        var c = this.canvas;
        c.addEventListener("mousedown", this.handleInteractStart, true);
        c.addEventListener("touchstart", (e) => {
            this.updateMousePosition(e);
            this.handleInteractStart(e);
        }, true);
        c.addEventListener("mousemove", this.handleInteractMove, true);
        c.addEventListener("touchmove", (e) => {
            this.updateMousePosition(e);
            this.handleInteractMove(e);
        }, true);
        c.addEventListener("mouseup", this.handleInteractEnd, true);
        c.addEventListener("touchend", (e) => {
            //this.updateMousePosition(e)
            this.handleInteractEnd(e)
        }, true);
        /*
        document.onkeypress = function(e) {
            e = e || window.event;
            console.log(e.keyCode);
        };*/
    };

    handleInteractStart = (e) => {
        e.preventDefault();
        var c = this.canvas;
        var rect = c.getBoundingClientRect();
        var mousePosition = this.state.mousePosition;
        this.setState({ mousedown: true });
        switch (this.props.selectedControl) {
            case ControlsEnum.grab:
                let hightlightNodeID = this.state.hightlightNodeID;
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
                let node = new Node(mousePosition.x, mousePosition.y, 0, 0, 0, 0, false, [], this.getUniqueID());
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
    }

    handleInteractMove = (e) => {
        e.preventDefault();
        var mouse = this.getMouseScreenPosition(e);
        var mousePosition = this.getMouseCanvasPosition(e);
        this.setState({
            mousePosition
        });
        switch (this.props.selectedControl) {
            case ControlsEnum.grab:
                // Only uses updated mousePosition
                if (!this.state.mousedown) {
                    let nearestNode = this.getNearestNode(mousePosition, 5, this.props.nodes);
                    this.setState({
                        hightlightNodeID: nearestNode ? nearestNode.id : null
                    });
                }
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
                } else {
                    let nearestNode = this.getNearestNode(mousePosition, 5, this.props.nodes);
                    this.setState({
                        hightlightNodeID: nearestNode ? nearestNode.id : null
                    });
                }
                break;
            case ControlsEnum.rope:
                if (this.state.mousedown) {
                    var distance = this.state.startCoords.subtract(mousePosition).length();
                    if (distance > config.nominalStringLength) {
                        let node = new Node(mousePosition.x, mousePosition.y, 0, 0, 0, 0, false, [], this.getUniqueID());
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
                let nearestNode = this.getNearestNode(mousePosition, 5, this.props.nodes);
                this.setState({
                    hightlightNodeID: nearestNode ? nearestNode.id : null
                });
                break;
        }
    }

    handleInteractEnd = (e) => {
        e.preventDefault();
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
    }

    draw = () => {
        // If scale changes then set the translate transform so that the zoom
        // happenens at the center of the view
        if (this.state.transform.scale.x !== this.props.scale) {
            let canvasSize = new Vector(this.canvas.width, this.canvas.height);
            let newScale = new Vector(this.props.scale, this.props.scale);
            let currentSize = this.state.transform.scale.multiply(canvasSize);
            let newSize = newScale.multiply(canvasSize);
            let canvasZoomTranslate = newSize.subtract(currentSize).divide(2);
            this.setState({
                transform: {
                    translate: this.state.transform.translate.subtract(canvasZoomTranslate),
                    scale: new Vector(this.props.scale, this.props.scale)
                }
            })
        }
        var showIDs = this.props.options.showIDs;
        // Clear and reset canvas
        const ctx = this.canvas.getContext("2d");
        let nodes = this.props.nodes;
        ctx.strokeStyle = "rgb(0,0,0)";
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
        ctx.setTransform(
            this.state.transform.scale.x,
            0,
            0,
            this.state.transform.scale.y,
            this.state.transform.translate.x,
            this.state.transform.translate.y
        );

        // Draw background grid grid
        ctx.strokeStyle = "#d0d0d0";
        let gridSize = 10 * config.metre;
        let transformedCanvas = new Vector(this.canvas.width, this.canvas.height).divide(this.state.transform.scale).add(gridSize);        
        let transformedOrigin = this.state.transform.translate.divide(this.state.transform.scale);
        let offset = transformedOrigin.modulus(gridSize);
        for (let x = 0; x < transformedCanvas.x; x = x + gridSize) {
            ctx.beginPath();
            ctx.moveTo(
                x - transformedOrigin.x + offset.x,
                0 - transformedOrigin.y + offset.y
            );
            ctx.lineTo(
                x - transformedOrigin.x + offset.x,
                transformedCanvas.y - transformedOrigin.y + offset.x
            );
            ctx.stroke();
        }
        for (let y = 0; y < transformedCanvas.y; y = y + gridSize) {
            ctx.beginPath();
            ctx.moveTo(
                0 - transformedOrigin.x + offset.x,
                y - transformedOrigin.y + offset.y
            );
            ctx.lineTo(
                transformedCanvas.x - transformedOrigin.x + offset.x,
                y - transformedOrigin.y + offset.y
            );
            ctx.stroke();
        }

        // Draw indicators around cursor if needed
        ctx.strokeStyle = "rgb(0,0,0)";
        if (this.state.mousedown && this.props.selectedControl === ControlsEnum.erase) {
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
            ctx.beginPath();
            if (node.id === this.state.hightlightNodeID) {
                ctx.fillStyle = "rgb(0, 255, 0)";
            }
            if (node.fixed) {
                ctx.fillRect(node.position.x - 2, node.position.y - 2, 5, 5);
            } else {
                ctx.fillRect(node.position.x - 1, node.position.y - 1, 3, 3);
            }
            ctx.fillStyle = "rgb(0, 0, 0)";
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
                if (node.id === this.state.hightlightNodeID) {
                    ctx.fillStyle = "rgb(0, 255, 0)";
                }
                if (node.fixed) {
                    ctx.fillRect(node.position.x - 2, node.position.y - 2, 5, 5);
                } else {
                    ctx.fillRect(node.position.x - 1, node.position.y - 1, 3, 3);
                }
                ctx.fillStyle = "rgb(0, 0, 0)";
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
