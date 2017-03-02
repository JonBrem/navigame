/**
    The Log class can be used to keep log functions in the code -
    if the log levels are all set to false, this won't log anything.

    So logs created for debugging can be left in the code without cluttering up everything.
    For instance:
    if levels["abc"] == true,
    then Log.log("abc", var1, var2); will have an output, if it is false, then that won't do anything.
*/
var Log = (function() {
    
    let that = {},
    levels = {
        "verbose": true,
        "debug": true
    };

    /**
        based on the number of arguments, different things happen:

        1 argument - whatever it is is logged to the console.
        2+ arguments - if the first argument is a key of "levels" (such as "verbose"),
                        the contents will be logged if that log level is enabled.
                        if the first argument is not a key of "levels", everything will be logged.
    */
    log = function() {
        let str = "";
        let params = [].slice.call(arguments); // <- fancy JS magic
        
        if (params.length == 1) {
            str = params[0];
            console.log(str);
        } else if (params.length >= 2) {
            if (params[0] in levels) {
                if (levels[params[0]]) {
                    params.shift();
                    console.log(params);
                }
            } else {
                console.log(params);
            }
        }
    }; 

    that.log = log;
    return that;
}());
