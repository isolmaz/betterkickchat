document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');
  const statusElement = document.getElementById('status');
  const messageElement = document.getElementById('message');

  if (error) {
    statusElement.textContent = 'Authentication Failed';
    statusElement.classList.add('error');
    messageElement.textContent = 'There was an error during authentication. Please try again.';
    return;
  }

  if (code) {
    // Send the code to the extension
    chrome.runtime.sendMessage({ type: 'OAUTH_CALLBACK', code }, (response) => {
      if (response?.success) {
        statusElement.textContent = 'Authentication Successful';
        statusElement.classList.add('success');
        messageElement.textContent = 'You can now close this window and return to Kick.com.';
        
        // Close the window after 3 seconds
        setTimeout(() => {
          window.close();
        }, 3000);
      } else {
        statusElement.textContent = 'Authentication Failed';
        statusElement.classList.add('error');
        messageElement.textContent = 'Failed to complete authentication. Please try again.';
      }
    });
  } else {
    statusElement.textContent = 'Invalid Request';
    statusElement.classList.add('error');
    messageElement.textContent = 'No authentication code found. Please try again.';
  }
}); 