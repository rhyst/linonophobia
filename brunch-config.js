// See http://brunch.io for documentation.
module.exports = {
    files: {
        javascripts: {
            joinTo: {
                "app.js": ["app/config.js", "app/helper.js", "app/vector.js", "app/front.js"],
                "worker.js": ["app/config.js", "app/helper.js", "app/vector.js", "app/worker.js"],
            }
        },
        stylesheets: { joinTo: "app.css" }
    },
    modules: {
        wrapper: (path, data) => {
            if (path == 'worker.js') {
              return `${data}`;
            } else {
              return `require.register("${path}", function(exports, require, module) {${data}});\n\n`
            }
        }
    }
};
