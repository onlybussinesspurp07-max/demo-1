document.getElementById("loginForm").addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    prn: document.getElementById('PRN_num').value.trim(),
    password: document.getElementById('loginPass').value.trim()
  }

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { "Content-type" : "application/json"},
      body: JSON.stringify(data)
    });

    const request = await response.json();

    if(request.message === 'success'){
      sessionStorage.setItem("prn", data.prn);

      window.location.href = '/profile';
    }
    else {
      alert(request.message);
      // document.getElementById('loginReport').innerText = request.message;
    }

    document.getElementById("PRN_num").value = '';
    document.getElementById("loginPass").value = '';

  }
  catch (err) {
    console.error(err);
    alert("Something Went Wrong!!");
    // document.getElementById("loginReport").innerText = 'Something Went Wrong';
  }
});

/* To do
 * Student login logic involves checking whether prn number and password
 * entered is valid. This is ok enough. Real problem is at the method of verification itself.
 * We are using prn number. Which we shouldn't. Think it out.*/




