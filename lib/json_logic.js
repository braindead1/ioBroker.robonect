const jsonLogic = require('json-logic-js');

/*
 * Convert a geo-ccordinate in DDM (degrees, minutes) format into decimal degrees
*/
jsonLogic.add_operation('convertDdmToDd', function (ddmString) {
    if (ddmString !== '') {
        const [degrees, minutes, direction] = ddmString.split(/°| /);

        let dd = parseInt(degrees) + parseFloat(minutes) / 60;

        if (direction == 'S' || direction == 'W') {
            dd = dd * -1;
        } // Don't do anything for N or E

        return dd.toFixed(6);
    } else {
        return '';
    }
});

/*
 *  Converto to string
*/
jsonLogic.add_operation('string', function (a) {
    return a.toString();
});

module.exports = jsonLogic;