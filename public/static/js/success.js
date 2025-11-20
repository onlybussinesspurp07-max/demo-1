document.addEventListener("DOMContentLoaded", async () => {
    const goHomeBtn = document.getElementById("goHomeBtn");
    const backToLoginBtn = document.getElementById("backToLoginBtn");


    ////////////////////////////
    const surveyFlag = true;
    const prn = sessionStorage.getItem("prn");

    try{
        const surveyStatus = await fetch("/updateSurveyFlag", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prn: prn,
            surveyFilled: surveyFlag
          })
        });
        const whatHappened = await surveyStatus.json();
      }
    catch (err){
        console.error("Error updating flag: ", err);
    }    
    ///////////////////////////

    goHomeBtn.addEventListener("click", (e) => {
        e.preventDefault();

        window.location.href = '/profile';
    });

    backToLoginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        try{sessionStorage.clear()} catch(_){};
        window.location.href = '/student';
    })
})