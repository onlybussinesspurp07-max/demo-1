document.addEventListener("DOMContentLoaded", async () => {
// Definations
  const teacherSelect = document.getElementById("teacherSelect");
  const headerText = document.querySelector(".header-left");
  const actions = document.querySelector(".form-actions");
  const submitAll = document.getElementById("submitAll");
  const continueBtn = actions?.querySelector(".btn.btn-primary");
  const resetBtn = actions?.querySelector(".btn.btn-sec");
  const backBtn = actions?.querySelector(".btn.btn-ter");

  let yr = sessionStorage.getItem("year");
  let brch = sessionStorage.getItem("branch");

// End of definations
// Dynamic Teacher list Loading Event Listener--->
  const dynTeacher = document.querySelector(".dynamicTeacher");
  const submitted = JSON.parse(sessionStorage.getItem("completed_teacher"));
  try {
    const response = await fetch(`/dyTeach?code=${yr}${brch}`); // from this route, just fetch. Nothing more.
    if(!response.ok) throw new Error("Failed to load teacher List");

    const teacherList = await response.json(); // getting teacher list from backend

    if(!sessionStorage.getItem("Teacher_List")){
      sessionStorage.setItem("Teacher_List", JSON.stringify(teacherList));
    }
    teacherList.forEach((tchr) => {
      const optEle = document.createElement("option");
      optEle.value = sessionStorage.getItem("year") + sessionStorage.getItem("branch");
      optEle.textContent = tchr;
      optEle.name = tchr;

      if (submitted && submitted.includes(tchr)){
        optEle.textContent = `${tchr} ✅`
      }
      dynTeacher.appendChild(optEle);
    });
  }
  catch (err) {
    console.error("Error Fetching teacher List: ", err);
  }
// End of Dynamic Teacher List Loading

// submitting logic

  const h1 = document.createElement('h1');
  h1.textContent = `${yr} ${brch} Feedback Form`;
  headerText.appendChild(h1);
 
  backBtn?.addEventListener("click", (e)=>{
    e.preventDefault();
    window.location.assign('/profile');
  });
// end of submitting logic

// continue Logic
  continueBtn?.addEventListener("click", (e) => {
    e.preventDefault();

    // getting the text of option of selected teacher

    const selectedOption = teacherSelect.options[teacherSelect.selectedIndex];
    const teacherName = selectedOption.name;
    const page = teacherSelect.value;

    if(!teacherName || !page) {
      alert("Please Select a teacher before continuing.");
      return;
    }

    saveTeacherSelection(page, teacherName);

    window.location.href = '/feedback_ques';
  })
// End of continue logic

// Reset logic
  resetBtn?.addEventListener("click", (e) => {
    if(window.confirm("Are you sure you want to reset ALL fileds?")){
    e.preventDefault();

    // removing things that are required to submit final form
    // so that students can restart again.
    sessionStorage.removeItem("feedbackData");
    sessionStorage.removeItem("selectedTeacher");
    sessionStorage.removeItem("Teacher_List");
    sessionStorage.removeItem("completed_teacher");
    document.getElementById("teacherSelect").value = '';
    alert("Session Cleared!");    
    location.reload();  
    }
  })
// End of reset logic

// submit all logic
/* To do:
 * Change the way data is sended and stored in server */
  submitAll?.addEventListener("click", async (e)=>{
    e.preventDefault();

    const flag = JSON.parse(sessionStorage.getItem("Teacher_List") || "[]");

    if(flag.length !== 0){
      return alert("Please give Feedback of every Teacher.")
    }
  
    // sending data to server
    const prn = sessionStorage.getItem("prn");
  
    ////////////////////////////// check 
      try{
        const status = await fetch(`/checkSurveyFlag?prn=${prn}`);
        const data = await status.json();
        
        if(data.surveyFilled === true){
          return alert("Survey already Submitted");
        }
      }
      catch (err){
        console.error("Error check flag status: ", err);
      }
    //////////////////////////// check

    try{
      const answersToSend = JSON.parse(sessionStorage.getItem("feedbackData"));
      const response = await fetch('/send-data', {
        method: "POST",
        headers: {
          'Content-Type':'application/json'
        },
        body: JSON.stringify(answersToSend)
      });

      const result = await response.json();
      if(result.status === "success"){
        window.location.href = "/success";
      }
      
    }
    catch (err){
      console.error("Error sending data, ", err);
    }

  });
});

function saveTeacherSelection(pageValue, teacherName){
  let data = JSON.parse(sessionStorage.getItem("feedbackData")) || {};

  //If this teacher doesn't exist, add em into our session data
  //Since data is stored in Json file which is similar to dictionary, we can simply check like this-
  if (!data[pageValue]){
    data[pageValue] = {};
  }
  if (!data[pageValue][teacherName]){
    data[pageValue][teacherName] = { answers: [] };
  }

  // save the data back into our session
  sessionStorage.setItem("feedbackData", JSON.stringify(data));
  sessionStorage.setItem("selectedTeacher", teacherName);

}

