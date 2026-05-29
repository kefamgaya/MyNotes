/* auth.js */
import { supabase } from './config.js';

// DOM Elements
const authForm = document.getElementById('auth-form');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSpinner = document.getElementById('auth-spinner');
const toggleModeLink = document.getElementById('toggle-mode-link');
const authSubtitle = document.getElementById('auth-subtitle');
const toggleModeContainer = document.getElementById('toggle-mode-container');

// Form Groups
const groupFullname = document.getElementById('group-fullname');
const groupUsername = document.getElementById('group-username');

// Form Fields
const fullNameInput = document.getElementById('fullname');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Alerts
const errorAlert = document.getElementById('auth-error-alert');
const errorMsg = document.getElementById('auth-error-msg');
const successAlert = document.getElementById('auth-success-alert');
const successMsg = document.getElementById('auth-success-msg');

// Password visibility toggle
const togglePwdBtn = document.querySelector('.btn-toggle-password');
const togglePwdIcon = document.getElementById('toggle-pwd-icon');

// Page State (default to 'signin')
let currentMode = 'signin'; 

// Check if user is already authenticated
async function checkActiveSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = 'index.html';
  }
}

// Show error banner
function showError(message) {
  successAlert.style.display = 'none';
  errorMsg.textContent = message;
  errorAlert.style.display = 'flex';
  
  // Shake the card slightly for tactile feedback
  const card = document.querySelector('.auth-card');
  card.style.transform = 'scale(0.99)';
  setTimeout(() => card.style.transform = 'scale(1)', 150);
}

// Show success banner
function showSuccess(message) {
  errorAlert.style.display = 'none';
  successMsg.textContent = message;
  successAlert.style.display = 'flex';
}

// Clear all alerts
function clearAlerts() {
  errorAlert.style.display = 'none';
  successAlert.style.display = 'none';
}

// Toggle authentication mode between signin and signup
function toggleMode(e) {
  if (e) e.preventDefault();
  clearAlerts();
  
  const submitTextSpan = authSubmitBtn.querySelector('.btn-text');
  
  if (currentMode === 'signin') {
    currentMode = 'signup';
    authSubtitle.textContent = 'Join NoteFlow! Create an account to sync your notes.';
    submitTextSpan.textContent = 'Sign Up';
    toggleModeContainer.innerHTML = 'Already have an account? <a href="#" id="toggle-mode-link">Sign In</a>';
    
    // Show signup fields with fade-in effect
    groupFullname.style.display = 'flex';
    groupUsername.style.display = 'flex';
  } else {
    currentMode = 'signin';
    authSubtitle.textContent = 'Welcome back! Please sign in to access your notes.';
    submitTextSpan.textContent = 'Sign In';
    toggleModeContainer.innerHTML = 'Need an account? <a href="#" id="toggle-mode-link">Sign Up</a>';
    
    // Hide signup fields
    groupFullname.style.display = 'none';
    groupUsername.style.display = 'none';
  }
  
  // Re-bind the toggle click event since the innerHTML swap deletes it
  document.getElementById('toggle-mode-link').addEventListener('click', toggleMode);
}

// Toggle password text visibility
function togglePasswordVisibility() {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    togglePwdIcon.textContent = 'visibility_off';
  } else {
    passwordInput.type = 'password';
    togglePwdIcon.textContent = 'visibility';
  }
}

// Form Validation
function validateForm() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  if (!email || !email.includes('@')) {
    showError('Please enter a valid email address.');
    return false;
  }
  
  if (password.length < 6) {
    showError('Password must be at least 6 characters.');
    return false;
  }
  
  if (currentMode === 'signup') {
    const username = usernameInput.value.trim();
    if (username.length < 3) {
      showError('Username must be at least 3 characters.');
      return false;
    }
  }
  
  return true;
}

// Handle submit operations
async function handleSubmit(e) {
  e.preventDefault();
  clearAlerts();
  
  if (!validateForm()) return;
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  const submitTextSpan = authSubmitBtn.querySelector('.btn-text');
  
  // Helper to restore button to interactive state
  function resetButtonState() {
    authSubmitBtn.disabled = false;
    authSpinner.style.display = 'none';
    submitTextSpan.textContent = currentMode === 'signin' ? 'Sign In' : 'Sign Up';
  }
  
  // Set loading state
  authSubmitBtn.disabled = true;
  authSpinner.style.display = 'block';
  submitTextSpan.textContent = currentMode === 'signin' ? 'Signing In...' : 'Signing Up...';
  
  try {
    if (currentMode === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      showSuccess('Success! Redirecting to workspace...');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
      
    } else {
      const fullName = fullNameInput.value.trim();
      const username = usernameInput.value.trim();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            full_name: fullName,
          }
        }
      });
      
      if (error) throw error;
      
      // If auto-logged in (email confirmation disabled)
      if (data.session) {
        showSuccess('Account created! Redirecting to workspace...');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } else {
        // Email confirmation required — reset button state first, then toggle to sign in
        resetButtonState();
        showSuccess('Account created! You can now sign in with your credentials.');
        authForm.reset();
        toggleMode(); // Switch UI back to Sign In mode
      }
    }
  } catch (error) {
    showError(error.message || 'An error occurred during authentication.');
    resetButtonState();
  }
}

// Listeners
document.addEventListener('DOMContentLoaded', () => {
  checkActiveSession();
  
  if (toggleModeLink) {
    toggleModeLink.addEventListener('click', toggleMode);
  }
  
  if (togglePwdBtn) {
    togglePwdBtn.addEventListener('click', togglePasswordVisibility);
  }
  
  if (authForm) {
    authForm.addEventListener('submit', handleSubmit);
  }
});
