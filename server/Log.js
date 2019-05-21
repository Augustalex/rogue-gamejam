module.exports = function Log({ limit }) {
    let log = [];

    return {
        push,
        read
    };

    function push(data) {
        log.push(data);
        if (log.length > limit) {
            log = log.slice(Math.round(limit * .5));
        }
    }

    function read() {
        return log;
    }
};
