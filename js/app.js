requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: "js/app",
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    // paths: {
    //     app: "../app"
    // }
});

// paper.install(window);
// paper.setup(document.getElementById("canvas")); 

// Start the main app logic.
requirejs(["test", "cart", "q"], function(test, cart, q) {
    console.log("in the require");
    console.log(test);
    console.log(cart);
    foo();
    // debugger;
});
