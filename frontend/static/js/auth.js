// Function to check if a user is logged in
function checkAuth(expectedRole) {
    const token = localStorage.getItem(`${expectedRole}_token`);
    
    // If there is no token for this role, kick them back to the Gateway page!
    if (!token) {
        window.location.href = "index.html"; // <-- Changed this line!
    }
    return token;
}

// Function to securely log out
function logout(role) {
    // 1. Remove the token from the browser's memory
    localStorage.removeItem(`${role}_token`);
    
    // 2. Send them back to the home page
    window.location.href = "index.html";
}