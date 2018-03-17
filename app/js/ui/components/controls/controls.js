import { h, Component } from "preact";
import { ControlsEnum } from "js/shared/constants.js";

export default class Controls extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (<div class="controls buttons has-addons">
            <button
                class={`button is-small ${this.props.selectedControl ==
                    ControlsEnum.pan && "is-active"}`}
                onClick={() => {
                    this.props.changeControl(ControlsEnum.pan);
                }}>
                <span class="icon">
                    <i class="far fa-hand-paper" />
                </span>
            </button>
            <button
                class={`button is-small ${this.props.selectedControl ==
                    ControlsEnum.grab && "is-active"}`}
                onClick={() => {
                    this.props.changeControl(ControlsEnum.grab);
                }}>
                <span class="icon">
                    <i class="far fa-hand-rock" />
                </span>
            </button>
            <button
                class={`button is-small ${this.props.selectedControl ==
                    ControlsEnum.anchor && "is-active"}`}
                onClick={() => {
                    this.props.changeControl(ControlsEnum.anchor);
                }}>
                <span class="icon">
                    <i class="fas fa-plus" />
                </span>
            </button>
            <button
                class={`button is-small ${this.props.selectedControl ==
                    ControlsEnum.rope && "is-active"}`}
                onClick={() => {
                    this.props.changeControl(ControlsEnum.rope);
                }}>
                <span class="icon">
                    <i class="fas fa-pencil-alt" />
                </span>
            </button>
            <button
                class={`button is-small ${this.props.selectedControl ==
                    ControlsEnum.erase && "is-active"}`}
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
                <span class="icon">
                    -
                </span>
            </button>
            <button class={`button is-small`} disabled>{this.props.scale}</button>
            <button
                  class={`button is-small`}
                  onClick={() => {
                      this.props.changeScale(true);
                  }}>
                <span class="icon">
                    +
                </span>
            </button>
            </div>);
    }
}
