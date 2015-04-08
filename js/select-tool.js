$("select.toolbox").each(function(e, a) {
    // console.log(e, a.options);
    var tools = $(a.options).each(function(j, option) {
        console.log(option.value);
        var s = '<div class="tool" value="'+option.value+'"></div>';

        $(a).before(s);
    });
    console.log(tools);
    // $(a).prepend(tools);
    // $(a).toggle(false);

    $("body").on("click", ".tool", function(e) {
        console.log($(this));
    });
});

// console.log(s.options);
