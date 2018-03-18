import { h, Component } from "preact";
import * as config from "js/shared/config";

export default class LoadModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            success: false,
            loadData: ''
        };
    }
    load = () => {
        this.props.worker.postMessage(["load", this.state.loadData]);
        this.setState({
            loaded: true,
            success:true
        })
    };
    setData = (e) => {
        this.setState({loadData:e.target.value})
    }
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
                                Paste your code below to load the simulation state.
                            </p>
                            <div class="field has-addons">
                                <div class="control">
                                    <input
                                        class="input"
                                        type="text"
                                        onChange={(e) => this.setData(e)}
                                    />
                                </div>
                                <div class="control">
                                    <button class="button" onClick={this.load}>
                                        <span class="icon is-small">
                                            <i class="fas fa-download" />
                                        </span>
                                    </button>
                                </div>
                            </div>
                            {this.state.loaded && (
                                <p>
                                    {this.state.success
                                        ? "Loaded"
                                        : "load failed"}
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        );
    }
}
