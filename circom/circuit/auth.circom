pragma circom 2.0.0;

include "./hash.circom";

template UserAuthentication () {  

   signal input useraddress;  
   signal input password;  
   signal output passwordhash;  

   component hash;
   hash = Hash();
   hash.in <== password;
   passwordhash <== hash.out;
}


component main {public [useraddress]} = UserAuthentication();