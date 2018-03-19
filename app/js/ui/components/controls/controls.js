import { h, Component } from "preact";
import { ControlsEnum, ActionsEnum } from "js/shared/constants.js";

export default class Controls extends Component {
    constructor(props) {
        super(props);
        this.state = {
            optionsVisible: false,
            paused: false
        };
    }

    render() {
        return (
            <div class="controls">
                <div class="buttons has-addons">
                    <button
                        class={`button is-small ${this.props.selectedControl ==
                            ControlsEnum.pan && "is-primary"}`}
                        onClick={() => {
                            this.props.changeControl(ControlsEnum.pan);
                        }}>
                        <span class="icon">
                            <i class="far fa-hand-paper" />
                        </span>
                    </button>
                    <button
                        class={`button is-small ${this.props.selectedControl ==
                            ControlsEnum.grab && "is-primary"}`}
                        onClick={() => {
                            this.props.changeControl(ControlsEnum.grab);
                        }}>
                        <span class="icon">
                            <i class="far fa-hand-rock" />
                        </span>
                    </button>
                    <button
                        class={`button is-small ${this.props.selectedControl ==
                            ControlsEnum.anchor && "is-primary"}`}
                        onClick={() => {
                            this.props.changeControl(ControlsEnum.anchor);
                        }}>
                        <span class="icon">
                            <i class="fas fa-plus" />
                        </span>
                    </button>
                    <button
                        class={`button is-small ${this.props.selectedControl ==
                            ControlsEnum.rope && "is-primary"}`}
                        onClick={() => {
                            this.props.changeControl(ControlsEnum.rope);
                        }}>
                        <span class="icon">
                            <i class="fas fa-pencil-alt" />
                        </span>
                    </button>
                    <button
                        class={`button is-small ${this.props.selectedControl ==
                            ControlsEnum.erase && "is-primary"}`}
                        onClick={() => {
                            this.props.changeControl(ControlsEnum.erase);
                        }}>
                        <span class="icon">
                            <i class="fas fa-eraser" />
                        </span>
                    </button>
                    <button
                        class={`button is-small`}
                        onClick={() => {
                            this.props.changeScale(false);
                        }}>
                        <span class="icon">-</span>
                    </button>
                    <button class={`button is-small`} disabled>
                        {this.props.scale}
                    </button>
                    <button
                        class={`button is-small`}
                        onClick={() => {
                            this.props.changeScale(true);
                        }}>
                        <span class="icon">+</span>
                    </button>
                    <button
                        class={`button is-small ${this.props.selectedControl ==
                            ControlsEnum.pause && "is-primary"}`}
                        onClick={() => {
                            this.props.worker.postMessage({type: this.state.paused ? ActionsEnum.run : ActionsEnum.pause})
                            this.setState({paused: !this.state.paused});
                        }}>
                        <span class="icon">
                            <i class={`fas ${ this.state.paused ? 'fa-play':'fa-pause'}`} />
                        </span>
                    </button>
                    <div
                        class={`dropdown ${this.state.optionsVisible &&
                            "is-active"}`}>
                        <div class="dropdown-trigger">
                            <button
                                class="button is-small"
                                onClick={() => {
                                    this.setState({
                                        optionsVisible: !this.state
                                            .optionsVisible
                                    });
                                }}>
                                <span class="icon is-small">
                                    <i class="fas fa-cog" />
                                </span>{" "}
                                <span class="icon is-small">
                                    <i
                                        class="fas fa-angle-down"
                                        aria-hidden="true"
                                    />
                                </span>
                            </button>
                        </div>
                        <div
                            class="dropdown-menu"
                            id="dropdown-menu2"
                            role="menu">
                            <div class="dropdown-content">
                                <div class="dropdown-item">
                                    <label class="checkbox">
                                        <input type="checkbox" onChange={e=>this.props.changeOption('showIDs', e.target.checked)}/>
                                        Show IDs
                                    </label>
                                </div>
                                <a class="dropdown-item" onClick={this.props.save}>
                                    Save
                                </a>
                                <a class="dropdown-item" onClick={this.props.load}>
                                    Load
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
