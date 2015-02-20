function Config_Manager(args){
  args = args || {};
  
  var apps_config = {};
  var datasource_mappings = {};
  
  var datasource_gdoc_id = null;
  var app_datasource_config = null;
  
  function process_username(username_format, username_value){
    switch(username_format){
      case "email":
        return User_Utils.get_username_from_domains(username_value, apps_config["auth"]["domains"]);
    }
    return username_value;
  }
  
  var root = {
  
    load_apps_config: function(args){
      args = args || {};
      if(args["apps_config_url"])
        apps_config = JSON.parse(UrlFetchApp.fetch(args["apps_config_url"])) || {};
      else if(args["apps_config_gdoc_id"])
        apps_config = JSON.parse(DriveApp.getFileById(args["apps_config_gdoc_id"]).getBlob().getDataAsString()) || {};  
      
    },
    
    get_apps_config: function(args){
      if(args)
        root.load_apps_config(args);
      return apps_config;
    },
    
    load_datasource_mappings: function(args){
      args = args || {};
      if(args["datasource_mappings_url"])
        datasource_mappings = JSON.parse(UrlFetchApp.fetch(args["datasource_mappings_url"])) || {};
      else if(args["datasource_mappings_gdoc_id"])
        datasource_mappings = JSON.parse(DriveApp.getFileById(args["datasource_mappings_gdoc_id"]).getBlob().getDataAsString()) || {};        
    },
    
    load_app_datasource_config: function(args){
      args = args || {};
      
      root.load_datasource_mappings(args);
      
      var datasource_gdoc = datasource_mappings[args["datasource_gdoc_id"]]; //from config.gs
      if(!(datasource_gdoc))
        return false;
      
      datasource_gdoc_id = args["datasource_gdoc_id"];
      
      //if(!(datasource_gdoc.config_gdoc_id))
        //return false;
      try{
        app_datasource_config = JSON.parse(DriveApp.getFileById(datasource_gdoc.config_gdoc_id).getBlob().getDataAsString());
      }catch(e){}
        
      if(app_datasource_config != null)
        return true;

      return false;
    },
    
    get_app_datasource_config: function(gdoc_id){        
      return app_datasource_config;
    },
    
    get_primary_key_section: function()
    {
      var section = (app_datasource_config || {})["primary_key"];
      if(!(section))
        return null;      
      
      return section;
    },    
    
    get_field_defs: function(gdoc_id)
    {
      var gdoc_config = app_datasource_config || {};
      if(gdoc_config["fields"])
      {
        var pk_section = root.get_primary_key_section();
        if(pk_section)
          gdoc_config["fields"]["primary_key"] = {"col_name":pk_section.col_name,"is_reserved":true};

        gdoc_config["fields"]["username"] = {"col_name":"Username", "is_reserved":true};
        gdoc_config["fields"]["timestamp"] = {"col_name":"Timestamp", "is_reserved":true};
      }
        
      return gdoc_config["fields"];      
    },
    
    get_field_def: function(gdoc_id, field_name)
    {
      var section = get_field_defs(gdoc_id);
      if(!(section))
        return null;      
      
      for(var name in section)
      {
        if(name.toString().toLowerCase() == field_name.toString().toLowerCase())
          return section[name];
      }
      
      return null;
    },
    
    check_sheet_access: function(gdoc_id, email){
      if(!(app_datasource_config) || !(apps_config))
        return false;
    
      var section = app_datasource_config["access"];
      if(!(section))
        return false;      
      
      if(section.allow_all)
        return true;
      
      if(section.allow_email_domains && User_Utils.get_username_from_domains(email, section.allow_email_domains))
        return true;
        
      if(section.gdoc_sheet != null){
        var access_gdoc_id = section.gdoc_id || datasource_gdoc_id;
        var access_gdoc_column = section.gdoc_column || "username";
        var access_gdoc_format = section.gdoc_column_format || "username";
        var access_list = Sheet_Utils.get_sheets({gdoc_id:access_gdoc_id, sheet_name:section.gdoc_sheet});
        if(access_list){
          access_list = access_list[section.gdoc_sheet] || [];
        }
        
        var username = User_Utils.get_username_from_domains(email, apps_config["auth"]["domains"]);
        if(!(username))
          return false;
        
        for(var i=0;i<access_list.length;i++){
          var list_username = process_username(access_gdoc_format, access_list[i][access_gdoc_column]);
          if(!(list_username))
            continue;
          if(list_username === username)
            return true;
        }
        
      }
      
      return false;
    },
    
    map_params: function(gdoc_args, params)
    {
      var sheet_headers = Sheet_Utils.get_header_row(gdoc_args);
      
      if(!(sheet_headers))
        return {};
      
      var param_mappings = JSON.parse(JSON.stringify(root.get_field_defs(gdoc_args.gdoc_id)));
      for(var param_name in param_mappings)
      { 
        var param_mapping = param_mappings[param_name];
        if(!param_mapping)
          continue;
        param_mapping["errors"] = [];
        if(!(param_mapping["is_reserved"]))
          param_mapping["value"] = (params[param_name]||'').toString().substring(0,1024);
        else
          Logger.log(param_name + ": is reserved.");
        
        for(var colIndex=0;colIndex<sheet_headers.length;colIndex++) //header columns
        {
          var col_name = sheet_headers[colIndex];
          if(col_name.toLowerCase()==param_mapping["col_name"].toLowerCase())
          {
            param_mapping["col_index"] = colIndex;
            param_mapping["errors"] = [];
            //param_mapping[param_name] = {
              //col_index:, 
              //param_name:param_name, 
              //col_name:col_name, 
              //field_def:config_manager.get_field_def(gdoc_id, col_name),
            //};
            break;
          }
        }
        if(!(param_mapping["col_index"]>-1))
          param_mapping["errors"].push("No Column Mapping Found. Contact Administrator: " + (((apps_config["notifications"] || {})["email"]) || "unknown") + ".");
      }
      return param_mappings;
    },
    
    map_params_list_to_row_array: function(list, length)
    {
      var row = new Array(length);
      //Logger.log(rows[0].length);
      //Logger.log(sheet.getLastColumn());
      for(var i=0;i<row.length;i++)
        row[i] = null;
        
      for(var i=0;i<list.length;i++){ //dump into row array - faster operation.
        var list_item = list[i];
        var col_index = list_item.col_no-1;
        if(col_index < row.length)
          row[col_index] = list_item.value;
      }    
      return row;
    }
  
  }
  
  root.load_apps_config(args);
  root.load_datasource_mappings(args);
  return root;
};
