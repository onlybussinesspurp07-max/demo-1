document.addEventListener("DOMContentLoaded", () => {
    const QUESTIONS_COUNT = 10;
    
    const form = document.getElementById("ratings_form");
    const backBtn = document.getElementById("cancel_btn");
    const nextBtn = document.getElementById("next_btn");
    
    const teacherName = document.getElementById("teacherName");
    
    const teacher = sessionStorage.getItem("selectedTeacher");
    const page = sessionStorage.getItem("year") + sessionStorage.getItem("branch");

    let data = JSON.parse(sessionStorage.getItem("feedbackData")) || {};

    //Initializing if nothings in sessionStorage
    if(!data[page]) data[page] = {};
    if(!data[page][teacher]) data[page][teacher] = { answers: [] }; 

    teacherName.textContent = teacher || "Selected Teacher";

    const prevAnswers = data[page][teacher].answers;
    if(Array.isArray(prevAnswers) && prevAnswers.length > 0){
        prevAnswers.forEach((ans, idx) => {
            if (ans !== null){
                const radio = form.querySelector(`input[name="q${idx + 1}"][value="${ans}"]`);
                if(radio) radio.checked = true;
            }
        });
        // logs can be added here for varification 
    }
    
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const answers = [];
        for (let i = 1; i<=QUESTIONS_COUNT; i++){
            const selected = form.querySelector(`input[name="q${i}"]:checked`); // checks if all queries with checked input exists
            if(selected){
                answers.push(parseInt(selected.value));
            }
            else {
                alert("Please answer every question!");
                return; // return just, well, in a way, restarts the state of button? Yeah. 
            }
        }

        data[page][teacher].answers = answers;

        sessionStorage.setItem("feedbackData", JSON.stringify(data));

        alert("Feedback saved successfully!");
        console.log("Saved feedback: ", data);

        //  Submitting logic starts here
        let teacherList = JSON.parse(sessionStorage.getItem("Teacher_List"));
        if(!teacherList[0]){
            alert("Every filed is answered!!");
        }
        // let index_ = teacherList.indexof(teacher);
        let updatedTeacherList = teacherList.filter(name => name != teacher);
        
        // sessionStorage.setItem("next_teacher", teacherList[index_]);
        sessionStorage.setItem("Teacher_List", JSON.stringify(updatedTeacherList));
        // push completed teachers
        if(!sessionStorage.getItem("completed_teacher")){
            sessionStorage.setItem("completed_teacher", JSON.stringify([]));
        }
        let completed = JSON.parse(sessionStorage.getItem("completed_teacher"));
        completed.push(teacher);
        sessionStorage.setItem("completed_teacher", JSON.stringify(completed));


        window.location.href = '/select_teacher';
    });
    
    backBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = '/select_teacher';
    });

    nextBtn.addEventListener("click", (e) => {
        e.preventDefault();

    })

})








