//quick ad-hoc unit tests.

function Unit_Tests() {
  var test_email = "kel@crk.umn.edu";
  var test_emails = [
    "kel@crk.umn.edu",
    "kel@umn.edu",
    "kel@gmail.com",
    "kel1@crk.umn.edu",
    "kel@crk1.umn.edu",
    "kel@d.crk.umn.edu",
    "kel@crk.umn.z.edu",
    "kel@crk.umn.edu1",
    "kel@crk.umn.eduz",
    "zkel@crk.umn.edu",
    "zkel@umn.edu",
    "billy@live.com",
    "franke@live.com",
    "franke@crk.umn.edu",
    "franke@umn.edu",
    "wut",
    "",
    null
  ];  
  
  var test_data = [
    {"student_name":"Student 1","tester_1":"yahha","username":"wut", "timestamp":"dah","primary_key":"asdfasd"},
    {"student_name":"Student 2"},
    {"student_name":"Student 3"},
    {"student_name":"Student 4"},
    {"student_name":"Student 5"},
    {"student_name":"Student 6"},
    {"student_name":"Student 7"},
    {"student_name":"Student 8"},
    {"student_name":"Student 9"},
    {"student_name":"Student 10"}
                  ];
  
  var test_sheet = {
    gdoc_id:"1CKRJDjpMOUyn9cXV2yTK4m5jt6NSyls2y6-r3nF_USM",
    sheet_name:"Responses"
  };
  
  var test_sheet_keyvalue_pairs = {
    gdoc_id:"1CKRJDjpMOUyn9cXV2yTK4m5jt6NSyls2y6-r3nF_USM",
    sheet_name:"KeyValuePairs"
  };  

  var config_manager = new Config_Manager({
    apps_config_url:"https://www.googledrive.com/host/0B-0F2e_GER44NGpDdFprSWNCcU0/scripts/apps_config.js",
    //datasource_mappings_url:"https://googledrive.com/host/0B-0F2e_GER44UlA4VmExdzY4a0E"
    datasource_mappings_gdoc_id:"0B-0F2e_GER44UlA4VmExdzY4a0E"
  });
  var apps_config = config_manager.get_apps_config();
  Logger.log("Apps Config: " + config_manager.get_apps_config());    
  Logger.log("Load apps datasource: " + config_manager.load_app_datasource_config({datasource_gdoc_id:test_sheet.gdoc_id}));
  
  function Test_App_Utils(){
    Logger.log(App_Utils.getUniqueId());
  }
  function Test_Config_Manager_Utils(){
    Logger.log("Get apps datasource: " + config_manager.get_app_datasource_config());
    Logger.log(config_manager.check_sheet_access(test_sheet.gdoc_id,test_email));
  }  
  function Test_Config_Manager_Utils_Security(){
    if(config_manager.load_app_datasource_config({datasource_gdoc_id:test_sheet.gdoc_id})){
      for(var i=0;i<test_emails.length;i++){
        var email = test_emails[i];
        Logger.log(email + ": " + config_manager.check_sheet_access(test_sheet.gdoc_id,email));
      }
    }
  }
  function Test_Sheet_Utils(){
    Logger.log(Sheet_Utils.get_spreadsheet({gdoc_id:test_sheet.gdoc_id}));    
    Logger.log(Sheet_Utils.get_sheet(test_sheet));
    Logger.log(Sheet_Utils.get_header_row(test_sheet));
    //Logger.log(Sheet_Utils.get_sheet_to_json(test_sheet)); //test json-ifier
    //Logger.log(Sheet_Utils.get_sheets({gdoc_id:test_sheet.gdoc_id})); //test get all sheets
    Logger.log(Sheet_Utils.get_sheets(test_sheet)); //test get a sheet
    Logger.log(Sheet_Utils.get_header_mapping(test_sheet));
    Logger.log(Sheet_Utils.get_data_rows(test_sheet));
    Logger.log(Sheet_Utils.get_sheet_to_html(test_sheet));
    
    //Logger.log(Sheet_Utils.get_row_from_key_column({gdoc_id:test_sheet.gdoc_id,sheet_name:"_db_info"},"primary_key_index_last","asdf5")); //test getting a row from key & value.
  }  
  function Test_Sheet_Utils_KeyValuePair(){ //data entry test
    Logger.log(Sheet_Utils.get_keyvalue_pair_sheet(test_sheet_keyvalue_pairs)); //test getting a sheet of key/value pairs.
    Logger.log(Sheet_Utils.update_keyvalue_pair_sheet(test_sheet_keyvalue_pairs,"Key 3","blah blah")); //test update/write key/value pair .        
  }  
  function Test_Sheet_Utils_Data_Entry(){ //data entry test
    Logger.log(Sheet_Utils.update_row(test_sheet,4,{"Student Name":"mmmk"})); //test updating a row.
  }
  function Test_Sheet_Utils_Data_Entry_Bulk(){ //data entry test
    for(var i=0;i<test_data.length;i++)
      Logger.log(Sheet_Utils.submit_data_to_row(test_sheet, config_manager, test_data[i]));    
  }
  function Test_User_Utils(){
    Logger.log(User_Utils.get_user_from_session());
    Logger.log(User_Utils.get_username_from_domains(test_email, apps_config["auth"]["domains"]));
    Logger.log(test_email);
  }
  function Test_User_Utils_Get_Username(){
    if(config_manager.load_app_datasource_config({datasource_gdoc_id:test_sheet.gdoc_id})){
      for(var i=0;i<test_emails.length;i++){
        var email = test_emails[i];
        Logger.log(email + ": " + User_Utils.get_username_from_domains(email,apps_config["auth"]["domains"]));
      }
    }
  }  

  //Test_Sheet_Utils_Data_Entry_Bulk();
  //Test_Sheet_Utils_KeyValuePair();
  //Test_Sheet_Utils_Data_Entry();
  return;
  Unit_Test_Utils.run_test_groups({
    "General Tests":{
      "Test_App_Utils":Test_App_Utils, 
      "Test_Config_Manager_Utils":Test_Config_Manager_Utils, 
      "Test_User_Utils":Test_User_Utils
    },
    "Sheet Tests":{
      "Test_Sheet_Utils":Test_Sheet_Utils,
      //"Test_Sheet_Utils_Data_Entry":Test_Sheet_Utils_Data_Entry       
    },
    "Security Tests":{
      "Test_User_Utils_Get_Username":Test_User_Utils_Get_Username,
      "Test_Config_Manager_Utils_Security":Test_Config_Manager_Utils_Security
    }
  });
  
  
}

