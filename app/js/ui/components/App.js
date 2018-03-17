import { h, Component } from "preact";
import Canvas from "js/ui/components/canvas/canvas";
import Controls from "js/ui/components/controls/controls";
import Stats from "js/ui/components/stats/stats";
import { ControlsEnum } from "js/shared/constants.js"
import * as config from "js/shared/config";

export default class App extends Component {
    constructor(props) {
        super(props);
        var worker = new Worker("worker.js");
        worker.onmessage = this.handleWorker;
        worker.postMessage("init");

        this.state = {
            worker,
            nodes: [],
            selectedControl: ControlsEnum.pan,
            scale: 1,
            options: {
              showIDs: false
            }
        };
    }

    componentDidMount() {
        requestAnimationFrame(this.onFrame);
        this.state.worker.postMessage("run");
    }

    onFrame = () => {
        this.state.worker.postMessage("send");
        requestAnimationFrame(this.onFrame);
    };

    handleWorker = data => {
        this.setState({
            nodes: data.data.nodes,
            trueSimulationSpeed: data.data.trueSimulationSpeed
        });
        //compute();
    };

    changeControl = control => {
      this.setState({
        selectedControl: control
      })
    }

    changeScale = positive => {
      let scale = this.state.scale;
      if ((!positive && scale <= 1) || (positive && scale < 1) ) {
        if (positive) {
          scale = scale + 0.1
        } else {
          scale = scale - 0.1
        }
        scale = Math.round(scale*10)/10
      } else {
        if (positive) {
          scale = scale + 1
        } else {
          scale = scale - 1
        }
      }
      if (scale <= 0) {
        return
      }
      this.setState({scale})

    }

    changeOption = (key, value) => {
      let options = this.state.options;
      options[key] = value;
      this.setState({options})
    }

    render() {
        return (
            <main>
                <Canvas options={this.state.options} nodes={this.state.nodes} worker={this.state.worker} selectedControl={this.state.selectedControl} scale={this.state.scale}/>
                <Controls selectedControl={this.state.selectedControl} changeControl={this.changeControl} changeScale={this.changeScale} scale={this.state.scale} options={this.state.options} changeOption={this.changeOption}/>
                <Stats trueSimulationSpeed={this.state.trueSimulationSpeed} />
            </main>
        );
    }
}

/*<div>Sim speed: <span id="simspeed"></span></div>
                <div><button id="start">Start</button><button id="stop">Stop</button></div>
                <div><input checked id="show-ids" type="checkbox" /> Show node IDs</div>
                <div>From: <input id="from"></input></div>
                <div>To: <input id="to"></input></div>
                <div>Force: <span id="result"></span></div>
                <div><input id="load-data" /><button id="load">Load</button></div>
                <div><input id="save-data" /><button id="save">Save</button></div>*/
