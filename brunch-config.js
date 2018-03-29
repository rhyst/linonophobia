
// See http://brunch.io for documentation.
module.exports = {
    files: {
        javascripts: {
            joinTo: {
                "app.js": [
                    /node_modules/,
                    "app/js/shared/**/*.js",
                    "app/js/initialise.js",
                    "app/js/ui/**/*.js"
                ],
                "worker.js": ["app/js/shared/**/*.js", "app/js/worker/**/*.js"]
            }
        },
        stylesheets: {
            joinTo: "app.css",
            order: {
                after: ["css/app.scss"]
            }
        }
    },
    modules: {
        wrapper: (path, data) => {
            if (path == "js/worker/worker.js") {
                return `${data}`;
            } else {
                return `require.register("${path}", function(exports, require, module) {${data}});\n\n`;
            }
        }
    },
    sourceMaps: "inline",
    plugins: {
        babel: {
            plugins: [
                ["transform-react-jsx", { pragma: "h" }],
                "transform-class-properties"
            ]
        },
        sass: {
            options: {
                includePaths: ["node_modules/bulma","node_modules/bulma-switch/dist"]
            }
        }
    }
};
