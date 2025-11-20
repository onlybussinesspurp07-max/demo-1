document.addEventListener("DOMContentLoaded", () => {
  
  const yearRadios = document.querySelectorAll("input[name='options']");
  const deptList = document.querySelector(".depts");
  const continueBtn = document.getElementById("continueBtn");
  const yearCodes = ["FE", "SE", "TE", "BE"];

  let selectedYear = null;
  let selectedDept = null;

  continueBtn.disabled = true;

  function checkContinue(){
    continueBtn.disabled = !(selectedYear && selectedDept);
  }
  // thankfully below code doesn't need any change in forseeable future
  yearRadios.forEach((radio, idx) => {
    radio.addEventListener("change", async () => {
      selectedYear = yearCodes[idx];
      selectedDept = null;
      checkContinue();

      console.log(`Selected Year: ${selectedYear}`);

      try {
        const response = await fetch(`/branch?year=${selectedYear}`);
        if(!response.ok) throw new Error("Failed to load branches");
        //branches is an array.
        const branches = await response.json();

        deptList.innerHTML = "";
        // Adding departments from the data we got from our dear server.
        branches.forEach((b) => {
          const li = document.createElement("li");
          li.textContent = b;
          li.classList.add(`option${idx+1}`, "dot");

          li.addEventListener("click", () => {
            document.querySelectorAll(".depts .dot")
            .forEach((el) => el.classList.remove("dept--active"));
            li.classList.add("dept--active");
            selectedDept = b;
            checkContinue();
          });
          deptList.appendChild(li);
        });
      }
      catch(err){
        console.error("Error fetching branch data:", err);
      }
    });
  });

  continueBtn.addEventListener("click", async () => {
    if (!selectedYear || !selectedDept) return;
    // Both selectedYear and selectedDept are strings.
    sessionStorage.setItem("year", selectedYear);
    sessionStorage.setItem("branch", selectedDept);

    let success = true;
////////////////////////////////////////////////
    try {
      const response = await fetch(`/dyTeach?code=${selectedYear}${selectedDept}`); // from this route, just fetch. Nothing more.
      if(!response.ok) throw new Error("Failed to load teacher List");

      const teacherList = await response.json(); // getting teacher list from backend

      sessionStorage.setItem("Teacher_List", JSON.stringify(teacherList)); // get the teacherList. Doesn't matter if it was present earlier.
  }
    catch (err) {
      console.error("Error Fetching teacher List: ", err);
      success = false;
  }
  if(!success) return;
////////////////////////////////////////////////
//////////////////////////
  try {
    const prn = sessionStorage.getItem("prn");
    const response = await fetch("/field_details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          prn,
          year: selectedYear,
          branch: selectedDept
        })
      }); // prn from stregistration.js

    if(!response.ok) throw new Error("Couldn't update field details"); 
  }
    catch(err){
      console.error("Error writing filed onto database");
      success = false;
  }
/////////////////////////////

  if(success) location.href = '/profile';
  })

  if(yearRadios.length > 0){
    yearRadios[0].dispatchEvent(new Event("change"));
  }
});

