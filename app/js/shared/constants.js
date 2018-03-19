export const ControlsEnum = Object.freeze({
    pan:    "pan",
    grab:   "grab",
    anchor: "anchor",
    erase:  "erase",
    rope:   "rope",
    pause:  "pause",
});

export const ActionsEnum = Object.freeze({
    init:       "init",
    run:        "run",
    pause:      "pause",
    send:       "send",
    load:       "load",
    move:       "move",
    nomove:     "nomove",
    addanchor:  "addanchor",
    addnodes:   "addnodes",
    deletenode: "deletenode"
})

module.exports = {
    ControlsEnum,
    ActionsEnum
}