var Sheet_Utils = {

  /*function get_sheet_data(args) { //gets array of row objects.
	    var sh = Sheet_Utils.get_sheet(args); //args["sheet"] || args["spreadsheet"].getSheetByName(args["sheet_name"]);
	    if (!sh)
	        return null;

	    var columns = args["columns"];
	    if (typeof columns == "undefined") {
	        columns = Sheet_Utils.get_header_row({
	            sheet: sh
	        });
	        columns = columns.map(function(p) {
	            return p.replace(/\s+/g, '_'); //replace spaces with underscores.
	        });
	    }

	    var rows = Sheet_Utils.getDataRows({
	        sheet: sh
	    });
	    var data = [];
	    for (var r = 0, l = rows.length; r < l; r++) {
	        var row = rows[r];
	        var record = {};
	        for (var i in columns) {
	            record[columns[i]] = convert(row[i]);
	        }
	        data.push(record);
	    }
	    return data;
	}*/


  _convert: function(value) {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  },

  get_spreadsheet: function(args) {
    try {
      return (args["spreadsheet"] || (SpreadsheetApp.openById(args["gdoc_id"])));
    } catch (e) {}
    return null;
  },

  get_sheet: function(args) {
    try {
      return (args["sheet"] || ((Sheet_Utils.get_spreadsheet(args)).getSheetByName(args["sheet_name"])));
    } catch (e) {}
    return null;
  },

  get_sheets: function(args) {
    var data = {};

    var ss = Sheet_Utils.get_spreadsheet(args);
    if (!ss)
      return data;

    if (args["sheet_name"]) {
      data[args["sheet_name"]] = Sheet_Utils.get_sheet_to_json({
        spreadsheet: ss,
        sheet_name: args["sheet_name"]
      });
    } else {
      // Grab all sheets 
      ss.getSheets().forEach(function(oSheet, iIndex) {
        var sName = oSheet.getName();
        if (!sName.match(/^_/)) { //skip those with a name that starts with an underscore
          data[sName] = Sheet_Utils.get_sheet_to_json({
            spreadsheet: ss,
            sheet_name: sName
          });
        }
      });
    }

    return data;
  },

  get_header_row: function(args) { //to array
    var sh = Sheet_Utils.get_sheet(args);
    if (!sh)
      return [];
    try {
      return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    } catch (e) {}
    return [];
  },

  get_header_mapping: function(args) { //to object
    var header_row = Sheet_Utils.get_header_row(args);
    var mapping = {};
    for (var i = 0; i < header_row.length; i++) {
      mapping[header_row[i]] = i;
    }
    return mapping;
  },

  get_data_rows: function(args) { //to 2d array.
    var sh = Sheet_Utils.get_sheet(args);
    if (!sh)
      return [];
    try {
      return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
    } catch (e) {}
    return [];
  },

  get_keyvalue_pair_sheet: function(args) {
    var sh = Sheet_Utils.get_sheet(args);
    if (!sh)
      return null;

    var rows = [];
    try {
      rows = sh.getRange(1, 1, sh.getLastRow(), 2).getValues();
    } catch (e) {}

    var pairs = {};
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (!(row[0]))
        break;

      pairs[row[0]] = row[1];
    }
    return pairs;
  },

  update_keyvalue_pair_sheet: function(args, key, value) {
    var sh = Sheet_Utils.get_sheet(args);
    if (!sh)
      return null;

    var range = null;
    try {
      range = sh.getRange(1, 1, sh.getLastRow(), 2);
    } catch (e) {}

    for (var i = 1; i <= range.getLastRow(); i++) {
      if (range.getCell(i, 1).getValue() == key) {
        range.getCell(i, 2).setValue(value);
        return true;
      }
    }
    return false;
  },

  update_row: function(args, row_index, fields) {

    var response = {
      "is_success": false,
      fields: {}
    };
    var sh = Sheet_Utils.get_sheet(args);
    if (!sh)
      return null;

    var header_mapping = Sheet_Utils.get_header_mapping({
      sheet: sh
    });
    var lock = LockService.getScriptLock();
    if (lock.tryLock(30000)) {

      for (var name in fields) {
        if (header_mapping[name] == null)
          continue;
        //Logger.log(row_index);
        sh.getRange(row_index, header_mapping[name] + 1, 1).getCell(1, 1).setValue(fields[name]);
      }
      response["is_success"] = true;
    } else {
      response["is_success"] = false;
      response["error"] = "Unable to get data source, record lock/busy issue. You may need to try this item again.";
    }
    lock.releaseLock();
    response["fields"] = fields;
    return response;
    //sheet_responses.getRange(response_row["row_index"], response_mapping["Updated On"]+1, 1).getCell(1,1).setValue(App_Utils.get_date("human"));        
  },

  get_row_from_key_column: function(args, col_name, key_value) {
    args = args || {};

    if (!(col_name) || !(key_value))
      return null;

    var rows = Sheet_Utils.get_sheet_to_json(args);
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (row[col_name] === key_value.toString()) {
        //row["row_index"] = (i+2); //assumes header row.
        return row;
      }
    }

  },

  get_sheet_to_json: function(args, col_names) { //sheet to array of row objects.
    var sh = Sheet_Utils.get_sheet(args);

    var headers = Sheet_Utils.get_header_row(args);
    if (headers.length == 0)
      return [];

    if (col_names) {
      var filtered_headers = [];
      for (var i = 0; i < col_names.length; i++) {
        for (var j = 0; j < headers.length; j++) {
          if (headers[j] == col_names[i]) {
            filtered_headers.push(headers[j]);
            continue;
          }
        }
      }
      headers = filtered_headers;
    }

    var rows = Sheet_Utils.get_data_rows(args);
    if (rows.length == 0)
      return [];

    var header_mapping = Sheet_Utils.get_header_mapping(args);
    var return_rows = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var row_object = {
        "row_index": (i + 2)
      }; //assumes header row.
      for (var j = 0; j < headers.length; j++) {
        row_object[headers[j]] = Sheet_Utils._convert(row[header_mapping[headers[j]]]);
      }
      return_rows.push(row_object);
    }
    return return_rows;
  },

  get_sheet_to_html: function(args, col_names, options) {
    return Sheet_Utils.get_json_rows_to_html(Sheet_Utils.get_sheet_to_json(args, col_names), null, options);
  },

  get_json_rows_to_html: function(rows, col_names, options) {
    options = options || {};

    var html = "";
    if (!(rows) || rows.length == 0)
      return html;

    if (col_names == null) {
      col_names = [];
      for (var name in rows[0]) {
        col_names.push(name);
      }
    }

    html += "<table>";
    html += "<tr>";
    //Logger.log(row);
    for (var index in col_names) {
      html += "<th>";
      html += col_names[index];
      html += "</th>";
    }

    if (options["extra_fields"]) {
      for (var name in options["extra_fields"]) {
        html += "<th>";
        html += [name];
        html += "</th>";
      }
    }

    html += "</tr>";

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      html += "<tr>";
      //Logger.log(row);
      for (var index in col_names) {
        html += "<td>";
        html += row[col_names[index]];
        html += "</td>";
      }

      if (options["extra_fields"]) {
        for (var name in options["extra_fields"]) {
          html += "<td>";
          html += options["extra_fields"][name].replace(/[{]{2}([a-zA-Z0-9_ ]+)[}]{2}/g, function(match, p1) {
            return row[p1];
          });
          html += "</td>";
        }
      }

      html += "</tr>";
    }
    html += "</table>";
    return html;
  },

  submit_data_to_row: function(args, config_manager, params) {
    args = args || {};
    var response = {
      "is_success": false,
      fields: {}
    };

    if (!(config_manager)) {
      response["error"] = "Missing the config_manager.";
      return response;
    }

    var sheet = Sheet_Utils.get_sheet(args);
    if (!sheet) {
      response["error"] = "Unable to get data source.";
      return response;
    }

    //var gdoc = SpreadsheetApp.openById(args["gdoc_id"]);
    //var sheet = gdoc.getSheetByName(sheet_name);
    var gdoc_id = sheet.getParent().getId();
    
    var param_mappings = config_manager.map_params({
      gdoc_id: gdoc_id,
      sheet_name: sheet.getName()
    }, params);
    response["fields"] = param_mappings;
    var missing_required = false;
    var field_defs = config_manager.get_field_defs();
    for (var param_mapping_name in param_mappings) {
      var param_mapping = param_mappings[param_mapping_name];

      if (param_mapping["isRequired"] && param_mapping["value"] == "") {
        param_mapping["errors"].push("Is Required.");
        missing_required = true
      }
    }

    if (missing_required)
      return response;

    param_mappings["username"]["value"] = Session.getActiveUser().getEmail();
    param_mappings["timestamp"]["value"] = new Date().toString();    
    //Primary Key column
    var pk_section = (config_manager.get_primary_key_section(gdoc_id));
    if (pk_section != null) {
      //var pairs = Sheet_Utils.getKeyPairSheet({spreadsheet:gdoc,sheetname:pk_section["store_sheet_name"]}) || {};
      //if(pairs[pk_section["store_col_name"]] != null)
      //{
      //var pk_value = parseInt(pairs[pk_section["store_col_name"]])+1;
      //var lock = LockService.getScriptLock();
      //if(lock.tryLock(30000)){
      //Sheet_Utils.updateKeyPairSheet({spreadsheet:gdoc,sheetname:pk_section["store_sheet_name"]},pk_section["store_col_name"],pk_value);
      //}else{
      //response["error"] = "lock issue.";
      //return response;
      //}
      //lock.releaseLock();

      //param_mappings["primary_key"]["value"] = pk_value;          
      param_mappings["primary_key"]["value"] = App_Utils.getUniqueId();
      //} 
    }
    //Logger.log(param_mappings);       

    var list = [];
    for (var param_mapping_name in param_mappings) { //put formatted values into a list.

      var param_mapping = param_mappings[param_mapping_name];
      //if(!(param_mapping))
      //continue;
      if (!(param_mapping["col_index"] > -1))
        continue;

      var col_no = (param_mapping["col_index"] + 1);
      if (param_mapping["max-length"] > -1) {
        param_mapping["value"] = param_mapping["value"].substring(0, param_mapping["max-length"]);
      }
      list.push({
        col_no: col_no,
        value: param_mapping["value"]
      });
    }

    var rows = [];
    rows.push(config_manager.map_params_list_to_row_array(list, sheet.getLastColumn()));
    //Logger.log(rows[0].length);
    //Logger.log(sheet.getLastColumn());
    /*for(var i=0;i<rows[0].length;i++)
    rows[0][i] = null;
                                
    for(var i=0;i<list.length;i++){ //dump into row array - faster operation.
    var list_item = list[i];
    var col_index = list_item.col_no-1;
    if(col_index < rows[0].length)
    rows[0][col_index] = list_item.value;
    }*/

    var lock = LockService.getScriptLock();
    if (lock.tryLock(30000)) {
      //sheet.getRange(sheet.getLastRow()+1, 1,1,rows[0].length).setValues(rows); //rows must be a 2d array.
      sheet.appendRow(rows[0]);
      response["is_success"] = true;
    } else {
      response["is_success"] = false;
      response["error"] = "Unable to get data source, record lock/busy issue. You may need to try this item again.";
    }
    lock.releaseLock();

    //Utilities.sleep(2500);

    function verify_added(check_row) { //not in use.
      var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
      var duplicate = false;
      for (i in data) {
        var row = data[i];
        if (row.join() == check_row.join()) {
          duplicate = true
          break
        }
      }
      return duplicate;
    }

    /*if(!(verify_added(rows[0])));
    {
    response["is_success"] = false;
    response["error"] = "Data Sync Error.:(";
    return response;
    //Logger.log("row verified");
    //sheet.getRange(sheet.getLastRow()+1, 1,1,rows[0].length).setValues(rows); //rows must be a 2d array.
    }*/
    //cell.setValue('="' + param_mapping["value"] + '"');     


    return response;
    /*for(var i=0;i<headers.length;i++)
    {
    var data_cell = ;
                                
    }*/
    //Logger.log(header);

  }

}
