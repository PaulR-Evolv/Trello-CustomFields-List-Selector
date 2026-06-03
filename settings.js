// Initialize the Trello iframe
const t = window.TrelloPowerUp.iframe();

// Ask Trello for the Lists, Custom Fields, and any previously saved settings
Promise.all([
  t.lists('all'), // <-- THIS IS THE FIX! We now ask for lists correctly.
  t.board('customFields'),
  t.get('board', 'shared', 'listFieldSettings', {})
]).then(function(results) {
  
  const lists = results[0] || [];
  const boardData = results[1] || {};
  const customFields = boardData.customFields || [];
  const savedSettings = results[2] || {};
  
  const container = document.getElementById('lists-container');
  const loading = document.getElementById('loading');
  const saveBtn = document.getElementById('save-btn');
  
  // Build an expanding bubble for every list on the board
  lists.forEach(list => {
    let details = document.createElement('details');
    let summary = document.createElement('summary');
    summary.innerText = list.name; // The Title of the Bubble
    details.appendChild(summary);
    
    // Put a checkbox for every custom field inside the bubble
    customFields.forEach(cf => {
      let label = document.createElement('label');
      label.className = "cf-item";
      
      let checkbox = document.createElement('input');
      checkbox.type = "checkbox";
      checkbox.dataset.listId = list.id;
      checkbox.dataset.cfId = cf.id;
      
      // If the user previously checked this box, keep it checked!
      if (savedSettings[list.id] && savedSettings[list.id].includes(cf.id)) {
        checkbox.checked = true;
      }
      
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(" " + cf.name));
      details.appendChild(label);
    });
    
    container.appendChild(details);
  });
  
  // Hide loading text and show the UI
  loading.style.display = 'none';
  saveBtn.style.display = 'block';
  
  // --- SAVE BUTTON LOGIC ---
  saveBtn.addEventListener('click', function() {
    saveBtn.innerText = "Saving...";
    let newSettings = {};
    
    // Find all the boxes the user checked
    let checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    
    checkboxes.forEach(box => {
      let lId = box.dataset.listId;
      let cfId = box.dataset.cfId;
      
      // Map the Custom Field ID to the List ID
      if (!newSettings[lId]) newSettings[lId] = [];
      newSettings[lId].push(cfId);
    });
    
    // Save the new map to Trello's shared memory, then close the pop-up
    t.set('board', 'shared', 'listFieldSettings', newSettings)
    .then(function() {
      t.closePopup();
    });
  });
  
}).catch(function(err) {
  // 🚨 Safety Net: If Trello rejects the request, show an error!
  console.error("Error loading settings:", err);
  document.getElementById('loading').innerText = "Oops! Something went wrong loading the data. Please close and try again.";
});
