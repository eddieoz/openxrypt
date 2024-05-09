document.addEventListener("DOMContentLoaded", () => {
  const queryString = new URLSearchParams(window.location.search);
  const publicKey = queryString.get("key");
  if (publicKey) {
    document.getElementById("publicKey").textContent =
      decodeURIComponent(publicKey);
  }
});
