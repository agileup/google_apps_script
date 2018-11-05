/** 
 * Google Apps Script - List all files & folders in a Google Drive folder, & write into a speadsheet.
 *    - Main function 1: List all folders
 *    - Main function 2: List all files & folders
 * 
 * Hint: Set your folder ID first! You may copy the folder ID from the browser's address field. 
 *       The folder ID is everything after the 'folders/' portion of the URL.
 * 
 * @version 1.0
 * @see     https://github.com/mesgarpour
 */

var folderId = '...';
 
// Main function 1: List all folders, & write into the current sheet.
function listFolers() {
  getFolderTree(folderId, false);
};

// Main function 2: List all files & folders, & write into the current sheet.
function listAll() {
  getFolderTree(folderId, true); 
};

function setLinkText(text, url) {
  return '=HYPERLINK("' + url + '","' + text + '")';
};

// =================
// Get Folder Tree
function getFolderTree(folderId, listAll) {
  try {
    // Get folder by id
    var parentFolder = DriveApp.getFolderById(folderId);
    
    // Initialise the sheet
    var file, data, sheet = SpreadsheetApp.getActiveSheet();
    sheet.clear();
    sheet.appendRow(["", "Folder", "File", "Description", "Created", "Updated"]);
    
    // Get files and folders
    getChildFolders(parentFolder.getName(), parentFolder, data, sheet, listAll);
    
    // sort
    sheet.sort(1)
    
    // clear first column data(for sorting)
    var tempColumn = sheet.getRange(1, 1, sheet.getLastRow());
    tempColumn.clear();
    
    // set alignment
    sheet.getDataRange().setVerticalAlignment("middle")
    
  } catch (e) {
    Logger.log(e.toString());
  }
};

// Get the list of files and folders and their metadata in recursive mode
function getChildFolders(parentName, parent, data, sheet, listAll) {
  var childFolders = parent.getFolders();
  var space = "    ";
  
  // 폴더 탐색
  while (childFolders.hasNext()) {
    var childFolder = childFolders.next();
    
    var fullPath = parentName+'/'+childFolder.getName();
    
    // 폴더 이름 가공
    var folderName = "";
    var depth = fullPath.split('/').length;
    for (var i = 1; i < depth-1; i++) folderName += space;
    if (depth > 2) folderName += "↳ ";
    folderName += childFolder.getName();
    
    // 폴더 행 데이터
    data = [
      fullPath,
      folderName,
      setLinkText("►", childFolder.getUrl()),
      childFolder.getDescription(),
      Utilities.formatDate(childFolder.getDateCreated(), Session.getScriptTimeZone(), "yyMMdd HH:mm"),
      Utilities.formatDate(childFolder.getLastUpdated(), Session.getScriptTimeZone(), "yyMMdd HH:mm")
    ];

    // Write
    sheet.appendRow(data);
    
    // exclude folder(path name)
    if (parentName === ".../...") {
      continue;
    }
    
    // 파일 탐색
    var files = childFolder.getFiles();
    while (listAll & files.hasNext()) {
      var childFile = files.next();
      var fullFilePath = parentName + "/" + childFolder.getName() + "/" + childFile.getName();
      
      // 파일 행 데이터
      data = [
        fullFilePath,
        "",
        setLinkText(childFile.getName(), childFile.getUrl()),
        childFile.getDescription(),
        Utilities.formatDate(childFile.getDateCreated(), Session.getScriptTimeZone(), "yyMMdd HH:mm"),
        Utilities.formatDate(childFile.getLastUpdated(), Session.getScriptTimeZone(), "yyMMdd HH:mm")
      ];
      
      // Write
      sheet.appendRow(data);
    }
    
    // Recursive call of the subfolder
    getChildFolders(parentName + "/" + childFolder.getName(), childFolder, data, sheet, listAll);  
  }
};

function onOpen() {
  // This line calls the SpreadsheetApp and gets its UI   
  // Or DocumentApp or FormApp.
  var ui = SpreadsheetApp.getUi();
 
  // These lines create the menu items and 
  // tie them to functions we will write in Apps Script
  ui.createMenu('Custom Functions')
      .addItem('Re-index', 'listAll')
  //  .addSeparator()
      .addToUi();
}
