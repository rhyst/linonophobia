import { h, Component } from "preact";
import * as config from "js/shared/config";

export default class Stats extends Component {
    constructor(props) {
        super(props);
        this.state = {
            simSpeeds: new Array(100).fill(config.simulationSpeed),
            calculatedSimSpeed: config.simulationSpeed,
            elapsedTimes: new Array(100).fill(0),
            calculatedelapsedTime: 0
        };
    }

    componentWillReceiveProps(props) {
        let simSpeeds = this.state.simSpeeds;
        simSpeeds.pop();
        simSpeeds.unshift(props.trueSimulationSpeed);
        let sum = simSpeeds.reduce(function(a, b) {
            return a + b;
        }, 0);
        this.setState({
            simSpeeds,
            calculatedSimSpeed: sum / simSpeeds.length
        });

        let elapsedTimes = this.state.elapsedTimes;
        elapsedTimes.pop();
        elapsedTimes.unshift(props.elapsedTimeSumAverage);
        sum = elapsedTimes.reduce(function(a, b) {
            return a + b;
        }, 0);
        this.setState({
            elapsedTimes,
            calculatedelapsedTime: sum / elapsedTimes.length
        });
    };

    render() {
        return (
            <div class="stats">
                <span>({this.props.originCoords.x.toFixed(0)}, {this.props.originCoords.y.toFixed(0)}) </span>
                <span>{this.state.calculatedSimSpeed.toFixed(2)}x </span>
                <span>{this.props.fps}fps </span>
                <span>{this.state.calculatedelapsedTime.toFixed(2)}ms</span>
            </div>
        );
    }
}
