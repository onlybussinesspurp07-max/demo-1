// It has to be a global variable
let otpVerified = false; //////////////////////////////// check change of flag fr. window.otpVerified to otpVerified

document.addEventListener("DOMContentLoaded", () => {
  const sendOtpBtn = document.getElementById("sendOtpBtn");
  const verifyOtpBtn = document.getElementById("verifyOtpBtn");
  const otpSection = document.getElementById("otp-section");
  const emailInput = document.getElementById("email");
  const otpInput = document.getElementById("otp");
  const nextToBranch = document.getElementById("nextToBranch"); // submission button

  const toServer = document.querySelectorAll(".inp"); // getting the element to send to server from here
  // Note: All selected elements are not required. So function created will sort them.


  // Otp And Email Verification Logic
    // Flag to check if OTP was verified

    //  Send OTP
    sendOtpBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      if (!email) {
        alert("Please enter a valid email address.");
        return;
      }

      try {
        const res = await fetch("/send-email-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        if (data.success) {
          alert("OTP sent to your email!");
          otpSection.style.display = "block";
        } else {
          alert("Failed to send OTP: " + data.message);
        }
      } catch (err) {
        alert("Server error while sending OTP.");
        console.error(err);
      }
    });

    // Verify OTP
    verifyOtpBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const otp = otpInput.value.trim();

      if (!email || !otp) {
        alert("Please enter both email and OTP.");
        return;
      }

      try {
        const res = await fetch("/verify-email-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });

        const data = await res.json();

        if (data.success) {
          otpVerified = true;
          alert("✅ OTP verified successfully!");
          otpInput.disabled = true;
          verifyOtpBtn.disabled = true;
        } else {
          alert(data.message);
        }
      } catch (err) {
        alert("Server error while verifying OTP.");
        console.error(err);
      }
    });

// Email Verification Logic Ends here

// Submission Logic
  nextToBranch.addEventListener("click", async (e)=>{
    e.preventDefault();

    const ok = await submitRegistration(toServer);

    if(ok) window.location.href = '/select';
  });
// End of submission Logic 
});

//  Registration submit validation
async function submitRegistration(toServer) {
  const email = document.getElementById("email").value.trim();
  const fieldsToSend = {};

  if (!email) {
    alert("Please enter your email before registering.");
    return 0;
  }

  if (!otpVerified) {
    alert("Please verify your email before submitting.");
    return 0;
  }


  const validFields = Array.from(toServer).filter(ele =>
    !ele.classList.contains("optional")
  );

  for (let ele of validFields) {
    if (ele.value.trim() === "") {
      alert(`Please fill ${ele.placeholder}`);
      return 0; 
    }
  }

  validFields.forEach(ele => {
    fieldsToSend[ele.name] = ele.value.trim();
  });

  fieldsToSend["surveyFilled"] = false; //////////////////////// check
  sessionStorage.setItem("prn", fieldsToSend.prn); // temporarely storing prn. deleting in select.js

  try{
    const response = await fetch("/registration_data", {
      method: 'POST',
      headers: { "Content-type" : "application/json" },
      body: JSON.stringify(fieldsToSend)
    });

    const request = await response.json();

    if(request.message === "success"){
      // alert("Registration successful!");
      return 1;
    }
    else{
      alert("Something went wrong while fetching: " + request.message);
      return 0;
    }
  }
  catch(err){
    console.error(err);
    return 0;
  }
  
}
