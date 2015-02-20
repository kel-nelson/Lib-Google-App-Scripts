var App_Utils = {
  get_date: function(date_type) //use to apply unified date format.
  {
    switch(date_type){
      case "human":
          return Utilities.formatDate(new Date(), "CST", "EEE, MMM d yyyy HH:mm:ss");
    }
    return new Date();
  },
  trim: function(value){
    value = value || "";
    return value.replace(/(^\s+|\s+$)/g,'');
  },
  getUniqueId: function(complexity_level) { //Closest thing to unique record id, since GAS doesn't officially have unique key generation support.
    complexity_level = complexity_level || 10;
    var now = new Date();
    var rando = "";
    for(var i=0;i<complexity_level;i++){ //add random number sets
      rando += (Math.random() * 999999).toString();
    }
    //var id = UiApp.getActiveApplication().getId();
    var digets = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, now + Session.getActiveUser().getEmail() + rando);
    var res = Utilities.base64Encode(digets);
    res = res.substr(0, res.length - 2).replace(/[/]/g,"_").replace(/[+]/g,"-");
    return res;
  },
  output_response: function(response, return_type, callback){
    var mimeType = ContentService.MimeType.JSON;
    var output = JSON.stringify(response);
    if(return_type == 'jsonp')
    {
      if(callback)
      {
        output = callback + "(" + output + ")";
        mimeType = ContentService.MimeType.JAVASCRIPT;
      }
    }
    
    return ContentService.createTextOutput(output)
    .setMimeType(mimeType);  
  }  
}

