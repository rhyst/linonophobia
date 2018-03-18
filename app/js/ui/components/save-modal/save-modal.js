import { h, Component } from "preact";
import * as config from "js/shared/config";

export default class SaveModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            copied: false,
            success: false
        };
    }
    copy = () => {
        var range = document.createRange();
        range.selectNode(this.input);
        window.getSelection().addRange(range);
        try {
            var successful = document.execCommand("copy");
            var msg = successful ? "successful" : "unsuccessful";
            this.setState({
                copied: true,
                success: true
            });
        } catch (err) {
            this.setState({
                copied: true,
                success: false
            });
        }
        window.getSelection().removeAllRanges();
    };
    render() {
        return (
            <div class={`modal ${this.props.visible && "is-active"}`}>
                <div class="modal-background" />
                <div class="modal-card">
                    <header class="modal-card-head">
                        <p class="modal-card-title">Save</p>
                        <button class="delete" aria-label="close" onClick={this.props.close}/>
                    </header>
                    <section class="modal-card-body">
                        <div class="content">
                            <p>
                                Copy the code below to save the current state of
                                the simulation.
                            </p>
                            <div class="field has-addons">
                                <div class="control">
                                    <input
                                        ref={input => (this.input = input)}
                                        class="input"
                                        type="text"
                                        readOnly
                                        value={this.props.saveData}
                                    />
                                </div>
                                <div class="control">
                                    <button class="button" onClick={this.copy}>
                                        <span class="icon is-small">
                                            <i class="fas fa-copy" />
                                        </span>
                                    </button>
                                </div>
                            </div>
                            {this.state.copied && (
                                <p>
                                    {this.state.success
                                        ? "Copied"
                                        : "Copy failed"}
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        );
    }
}
