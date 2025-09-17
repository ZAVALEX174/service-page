"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const utils_1 = require("../utils");
var Logger;
(function (Logger) {
    let scopedConsole = console;
    let logEnabled = true;
    /** Get a time marker `hh:MM:ss` for current time. */
    function getTimeMarker() {
        let date = new Date();
        return '['
            + String(date.getHours())
            + ':'
            + String(date.getMinutes()).padStart(2, '0')
            + ':'
            + String(date.getSeconds()).padStart(2, '0')
            + '] ';
    }
    /**
     * Pipe messages to connection, such that all messages will be shown in output channel.
     * After tested I found just using `console.xxx` can also output messages,
     * so this piping should be useless anymore, may be removed after checking it carefully.
     */
    function pipeTo(connection) {
        scopedConsole = connection.console;
    }
    Logger.pipeTo = pipeTo;
    /** Enables or disables log level message, that means, not important messages. */
    function setLogEnabled(enabled) {
        logEnabled = enabled;
    }
    Logger.setLogEnabled = setLogEnabled;
    /** Log level message. */
    function log(msg) {
        if (logEnabled) {
            scopedConsole.log(getTimeMarker() + msg);
        }
    }
    Logger.log = log;
    /** Info level message. */
    function info(msg) {
        scopedConsole.info(getTimeMarker() + msg);
    }
    Logger.info = info;
    /** Warn level message. */
    function warn(msg) {
        scopedConsole.info(getTimeMarker() + '⚠️ ' + msg);
    }
    Logger.warn = warn;
    /** Error level message. */
    function error(msg) {
        scopedConsole.info(getTimeMarker() + '❌ ' + String(msg));
    }
    Logger.error = error;
    let startTimeMap = new Map();
    function getTimestamp() {
        let time = process.hrtime();
        return time[0] * 1000 + time[1] / 1000000;
    }
    Logger.getTimestamp = getTimestamp;
    /** Start a new time counter with specified name. */
    function timeStart(name) {
        startTimeMap.set(name, getTimestamp());
    }
    Logger.timeStart = timeStart;
    /** End a time counter with specified name. */
    function timeEnd(name, message = null) {
        let startTime = startTimeMap.get(name);
        if (startTime === undefined) {
            warn(`Timer "${name}" is not started`);
            return;
        }
        startTimeMap.delete(name);
        let timeCost = Math.round(getTimestamp() - startTime);
        if (message !== null) {
            log('🕒 ' + message + ` in ${timeCost} ms`);
        }
    }
    Logger.timeEnd = timeEnd;
    /** Log executed time of a function, which will return a list, or a single item. */
    function logQuerierExecutedTime(fn, type) {
        return async (...args) => {
            let startTime = getTimestamp();
            let result = null;
            try {
                result = await fn(args[0], startTime);
            }
            catch (err) {
                error(String(err));
                return null;
            }
            let time = (0, utils_1.toDecimal)(getTimestamp() - startTime, 1);
            if (Array.isArray(result)) {
                if (result.length === 0) {
                    log(`🔍 No ${type} found, ${time} ms cost`);
                }
                else if (result.length === 1) {
                    log(`🔍 1 ${type} found, ${time} ms cost`);
                }
                else {
                    log(`🔍 ${result.length} ${type}s found, ${time} ms cost`);
                }
            }
            else {
                if (result) {
                    log(`🔍 1 ${type} found, ${time} ms cost`);
                }
                // Too many hover messages.
                else if (type !== 'hover') {
                    log(`🔍 No ${type} found, ${time} ms cost`);
                }
            }
            return result;
        };
    }
    Logger.logQuerierExecutedTime = logQuerierExecutedTime;
})(Logger || (exports.Logger = Logger = {}));
//# sourceMappingURL=logger.js.map