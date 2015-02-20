var User_Utils = {
  get_user_from_session: function(){
    var user = {};
    user["email"] = Session.getActiveUser().getEmail();
    user["email"] = (user["email"] == '')?null:user["email"]; //standardize to default: null  
    user["username"] = User_Utils.get_username_from_domains(user["email"],["crk.umn.edu"]);    
    return user;
  },
  get_username_from_domains: function(user_email, domains){
    user_email = user_email || "";
    domains = domains || [];//email_domains_allowed; //defaults to a global array of approved domains.
    var parts = user_email.split('@');
    if(parts.length==2){
      for(var i=0;i<domains.length;i++){
        var domain = domains[i];
        if(parts[1] === domain)
          return App_Utils.trim(parts[0]);
      }
    }
    return null;
  },
}
