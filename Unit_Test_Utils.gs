var Unit_Test_Utils = {
  run_tests: function(names){
    for(var name in names){
      Logger.log('#' + name);
      eval(names[name])();
      Logger.log("###");
    }
  },
  run_test_groups: function(groups){
    for(var group in groups){
      Logger.log("===" + group + "===");
      Unit_Test_Utils.run_tests(groups[group]);
      Logger.log("");
      Logger.log("");
    }    
  }
}

