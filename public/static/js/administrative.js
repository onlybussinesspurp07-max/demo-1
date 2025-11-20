document.addEventListener("DOMContentLoaded", ()=> {
  const username = document.getElementById("username");
  const password = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");

  loginBtn.addEventListener("click", (e)=>{
    e.preventDefault();

    const loginUsername = username.value.trim();
    const loginPassword = password.value.trim();

    if (!loginUsername){
      return alert("Please Enter Username");
    }

    if (loginUsername !== "prathm9922"){
      return alert("Wrong Username");
    }
    if(loginPassword !== "261722"){
      return alert("Wrong password");
    }

    window.location.href = '/after_login_admin';
  });
  
})