/**
 * Adds a custom menu to the active spreadsheet, containing a single menu item
 * for invoking the exportJSON() function specified above.
 * The onOpen() function, when defined, is automatically invoked whenever the
 * spreadsheet is opened.
 * For more information on using the Spreadsheet API, see
 * https://developers.google.com/apps-script/service_spreadsheet
 */
function onOpen() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var entries = [{
        name : "L10N 만들기",
        functionName : "exportJSON"
    }];
    sheet.addMenu("Export JSON", entries);
};

// triggers parsing and displays results in a text area inside a custom modal window
function exportJSON() {
    var app = UiApp.createApplication().setTitle('JSON export results - select all and copy!');
    var textArea = app.createTextArea();
    textArea.setValue(makeJson(SpreadsheetApp.getActiveSheet().getDataRange()));
    app.add(textArea);
    textArea.setSize("100%", "100%");
    SpreadsheetApp.getActiveSpreadsheet().show(app);
};

function makeJson(dataRange) {
    var charSep = '"';

    var result = "", thisName = "", thisData = "";

    var frozenRows = SpreadsheetApp.getActiveSheet().getFrozenRows();
    var dataRangeArray = dataRange.getValues();
    var dataWidth = dataRange.getWidth();
    var dataHeight = dataRange.getHeight() - frozenRows;

    // range of names - we assume that the last frozen row is the list of properties
    var nameRangeArray = dataRangeArray[frozenRows - 1];

    Logger.log();

    // open JSON object - if there's a extra frozen row on the top wrap results into that as property (only supports one for now)
    result += frozenRows > 1 ? '{"' + dataRangeArray[frozenRows - 2][0] + '": [' : '[';

    for (var h = 0; h < dataHeight ; ++h) {
        result += '{';

        for (var i = 0; i < dataWidth; ++i) {
            thisName = nameRangeArray[i];
            thisData = dataRangeArray[h + frozenRows][i];

            // add name 
            result += charSep + thisName + charSep + ':'

            // add data
            result += charSep + jsonEscape(thisData) + charSep + ', ';
        }

        // remove last comma and space
        result = result.slice(0,-2);

        result += '},\n';
    }

    //remove last comma and line break
    result = result.slice(0,-2);

    // close object
    result += frozenRows > 1 ? ']}' : ']';

    return result;
}

function jsonEscape(str)  {
    if (typeof str === "string" && str !== "") {
        return str.replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/\t/g, "\\t");
    } else {
        return str;
    }
}
