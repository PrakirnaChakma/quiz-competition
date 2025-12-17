const params = new URLSearchParams(window.location.search);
const token = params.get("token");

if (!token) {
  document.body.innerHTML = "Access denied.";
}

fetch(`/.netlify/functions/validateToken?token=${token}`)
  .then(res => {
    if (!res.ok) throw new Error("Invalid token");
    return res.json();
  })
  .then(data => {
    sessionStorage.setItem("email", data.email);
    sessionStorage.setItem("token", token);
    window.location.href = "/quiz.html";
  })
  .catch(err => {
    console.error(err);
    document.body.innerHTML = "Invalid or expired link.";
  });
