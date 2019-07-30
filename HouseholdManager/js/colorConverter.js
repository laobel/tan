function getTintValue(alpha,tint, bgTint) {
    var tmp = Math.floor((1 - alpha ) * bgTint + alpha * tint);
    if( tmp > 255 ) {
        return 255;
    }
    return tmp;
}

function hex(x) {
    return ("0" + parseInt(x).toString(16)).slice(-2);
}

var colorConverter = {

};

/**
 * rgba转rgb
 * @param rgba
 * @param bgColor
 * @return {{red: number, green: number, blue: number}}
 * @constructor
 */
colorConverter.RGBA2RGB=function(rgba,bgColor){
    rgba = rgba.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d?(\d|(\.[1-9]{1,2})))\)$/);
    var red=parseInt(rgba[1]);
    var green=parseInt(rgba[2]);
    var blue=parseInt(rgba[3]);
    var alpha= parseFloat(rgba[4]);

    bgColor=bgColor===undefined?'rgba(255,255,255,1)':bgColor;
    bgColor = bgColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d?(\d|(\.[1-9]{1,2})))\)$/);
    var bRed=parseInt(bgColor[1]);
    var bGreen=parseInt(bgColor[2]);
    var bBlue=parseInt(bgColor[3]);
    var bAlpha = parseFloat(bgColor[4]);

    return 'rgb('+getTintValue(alpha, red, bRed )+','+getTintValue(alpha, green, bGreen )+','+
        getTintValue(alpha, blue, bBlue )+')';
};

/**
 * 将rgb颜色转成hex
 * @return {string}
 */
colorConverter.RGB2Hex=function (rgb) {
    var bg = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

    return ("#" + hex(bg[1]) + hex(bg[2]) + hex(bg[3])).toUpperCase();
};

/**
 * hex转rgb
 *
 * @param hex
 * @return {string}
 * @constructor
 */
colorConverter.Hex2RGB=function (hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 'rgb(' + [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ].join(',') + ')' : hex;
};

/**
 * hex转rgba
 *
 * @param hex
 * @return {string}
 * @constructor
 */
colorConverter.Hex2RGBA=function (hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 'rgba(' + [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
        1
    ].join(',') + ')' : hex;
};