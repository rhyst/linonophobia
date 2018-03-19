import { h, Component } from "preact";
import Canvas from "js/ui/components/canvas/canvas";
import Controls from "js/ui/components/controls/controls";
import Stats from "js/ui/components/stats/stats";
import SaveModal from "js/ui/components/save-modal/save-modal";
import LoadModal from "js/ui/components/load-modal/load-modal";
import { Vector } from "js/shared/vector.js";
import { ControlsEnum, ActionsEnum } from "js/shared/constants.js";
import * as config from "js/shared/config";

export default class App extends Component {
    constructor(props) {
        super(props);
        var worker = new Worker("worker.js");
        worker.onmessage = this.handleWorker;
        worker.postMessage({ type: ActionsEnum.init });

        this.state = {
            worker,
            nodes: [],
            selectedControl: ControlsEnum.pan,
            scale: 1,
            options: {
                showIDs: false
            },
            saveData: null,
            saveModalVisible: false,
            loadModalVisible: false,
            trueSimulationSpeed: 1,
            elapsedTimeSumAverage: 0,
            originCoords: new Vector(0, 0),
            fps: 0,
            frames: 0,
            time: self.performance.now()
        };
    }

    componentDidMount() {
        requestAnimationFrame(this.onFrame);
        this.state.worker.postMessage({ type: ActionsEnum.run });
    }

    onFrame = () => {
        let currentTime = self.performance.now();
        if (currentTime - this.state.time > 1000) {
            this.setState({
                time: currentTime,
                fps: this.state.frames,
                frames: 0
            });
        }
        this.setState({
            frames: this.state.frames + 1
        })
        this.state.worker.postMessage({ type: ActionsEnum.send });
        requestAnimationFrame(this.onFrame);
    };

    handleWorker = data => {
        this.setState({
            nodes: data.data.nodes,
            trueSimulationSpeed: data.data.trueSimulationSpeed,
            elapsedTimeSumAverage: data.data.elapsedTimeSumAverage
        });
        //compute();
    };

    changeControl = control => {
        this.setState({
            selectedControl: control
        });
    };

    changeScale = positive => {
        let scale = this.state.scale;
        if ((!positive && scale <= 1) || (positive && scale < 1)) {
            if (positive) {
                scale = scale + 0.1;
            } else {
                scale = scale - 0.1;
            }
            scale = Math.round(scale * 10) / 10;
        } else {
            if (positive) {
                scale = scale + 1;
            } else {
                scale = scale - 1;
            }
        }
        if (scale <= 0) {
            return;
        }
        this.setState({ scale });
    };

    changeOption = (key, value) => {
        let options = this.state.options;
        options[key] = value;
        this.setState({ options });
    };

    changeOriginCoords = originCoords => {
        this.setState({
            originCoords
        });
    };

    save = () => {
        this.setState({
            saveData: btoa(JSON.stringify(this.state.nodes)),
            saveModalVisible: true
        });
    };

    render() {
        return (
            <main>
                <Canvas
                    options={this.state.options}
                    nodes={this.state.nodes}
                    worker={this.state.worker}
                    selectedControl={this.state.selectedControl}
                    scale={this.state.scale}
                    changeOriginCoords={this.changeOriginCoords}
                />
                <Controls
                    worker={this.state.worker}
                    selectedControl={this.state.selectedControl}
                    changeControl={this.changeControl}
                    changeScale={this.changeScale}
                    scale={this.state.scale}
                    options={this.state.options}
                    changeOption={this.changeOption}
                    save={this.save}
                    load={() => this.setState({ loadModalVisible: true })}
                />
                <Stats
                    trueSimulationSpeed={this.state.trueSimulationSpeed}
                    elapsedTimeSumAverage={this.state.elapsedTimeSumAverage}
                    originCoords={this.state.originCoords}
                    fps={this.state.fps}
                />
                <SaveModal
                    visible={this.state.saveModalVisible}
                    saveData={this.state.saveData}
                    close={() => this.setState({ saveModalVisible: false })}
                />
                <LoadModal
                    visible={this.state.loadModalVisible}
                    worker={this.state.worker}
                    close={() => this.setState({ loadModalVisible: false })}
                />
            </main>
        );
    }
}