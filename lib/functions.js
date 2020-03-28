/*
 * Convert a geo-ccordinate in DMS (degrees, minutes, seconds) format into decimal degrees
 */
function convertDmsToDd(dmsString) {
    let [degrees, minutes, seconds, direction] = dmsString.split(/[^\d\w]+/);

    let dd = degrees + minutes/60 + seconds/(60*60);

    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
}