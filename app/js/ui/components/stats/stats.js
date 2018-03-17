import { h, Component } from "preact";
import * as config from "js/shared/config";

export default class Stats extends Component {
    constructor(props) {
        super(props);
        this.state = {
            simSpeeds: new Array(100).fill(config.simulationSpeed),
            calculatedSimSpeed: config.simulationSpeed
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
    };

    render() {
        return (
            <div class="stats">
                <span>{this.state.calculatedSimSpeed.toFixed(2)}x</span>
            </div>
        );
    }
}
