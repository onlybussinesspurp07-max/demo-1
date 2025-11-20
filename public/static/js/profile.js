document.addEventListener("DOMContentLoaded", async () => {
    const edu = document.getElementById("education_detail");
    const giveFeedbackBtn = document.getElementById("giveFeedbackBtn");
    const logOutBtn = document.getElementById("logOutBtn");

    const prn = sessionStorage.getItem("prn");
    if(!prn){
        edu.innerText = "Unable to load (no id)";
        return;
    }
    let yearCode = null;
    /////////
    try {
        const response = await fetch(`/post_yearCode?prn=${prn}`);

        if(!response.ok) throw new Error("Couldn't update field details"); 
        
        const data = await response.json();
        yearCode = data.yearCode; // yearCode is a text

        edu.innerText = yearCode || "Not available"; /////////////////////
    
        try {
            let yearAndBranch = splitIntoTwoParts(yearCode);
            sessionStorage.setItem("year", yearAndBranch[0]) 
            sessionStorage.setItem("branch", yearAndBranch[1])
        }
        catch( _ ) {}

    }
    catch(err){
        console.error("Error fetching yearCode: ", err);
        edu.innerText = "Error loading data";
    }

    giveFeedbackBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        ////////////////// check
        try{
            const prn = sessionStorage.getItem("prn");
            const response = await fetch(`/checkSurveyFlag?prn=${prn}`);
            
            if(!response.ok){
                console.error("Flag check failed");
                return;
            }
            const data = await response.json();

            if(data.surveyFilled === true){
                alert("Survey Already Submitted");
                return;
            }
        }
        catch(err){
            console.error("Error checking Flag: ", err);
            return;
        }

        if(!yearCode){
            alert("Contact admin to add yearCode");
            return;
        }
        window.location.href = '/select_teacher';
    });
  /////////////// check

    logOutBtn.addEventListener("click", (e)=>{
        e.preventDefault();
        try{sessionStorage.clear()} catch( _ ) {}
        window.location.href = '/';
    })
})

function splitIntoTwoParts(inputText){
    const firstSpaceIndex = inputText.search(/\s/);

    if(firstSpaceIndex === -1){
        return [inputText, ""];
    }
    const firstWord = inputText.substring(0, firstSpaceIndex);

    const remainingText = inputText.substring(firstSpaceIndex + 1).trim();

    return [firstWord, remainingText]
}