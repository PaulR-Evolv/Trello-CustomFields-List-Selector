// Step 1: Prove the script is actually running!
const loading = document.getElementById('loading');
loading.innerText = "Step 1: Script started...";

try {
  // Step 2: Initialize Trello
  const t = window.TrelloPowerUp.iframe();
  loading.innerText = "Step 2: Connected to Trello...";

  // Step 3: Ask Trello for the data correctly!
  Promise.all([
    t.lists('all'),
    t.board('customFields'),
    t.get('board', 'shared', 'listFieldSettings', {})
  ]).then(function(results) {
    loading.innerText = "Step 3: Data received! Building UI...";
    
    const lists = results[0] || [];
    const boardData = results[1] || {};
    const customFields = boardData.customFields || [];
    const savedSettings = results[2] || {};
    
    const container = document.getElementById('lists-container');
    const saveBtn = document.getElementById('save-btn');
    
    // Build the expanding bubbles
    lists.forEach(list => {
      let details = document.createElement('details');
      let summary = document.createElement('summary');
      summary.innerText = list.name; 
      details.appendChild(summary);
      
      customFields.forEach(cf => {
        let label = document.createElement('label');
        label.className = "cf-item";
        
        let checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.dataset.listId = list.id;
        checkbox.dataset.cfId = cf.id;
        
        // Check it if the user saved it previously
        if (savedSettings[list.id] && savedSettings[list.id].includes(cf.id)) {
          checkbox.checked = true;
        }
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + cf.name));
        details.appendChild(label);
      });
      
      container.appendChild(details);
    });
    
    // Hide the loading text and show the UI!
    loading.style.display = 'none';
    saveBtn.style.display = 'block';
    
    // Save button logic
    saveBtn.addEventListener('click', function() {
      saveBtn.innerText = "Saving...";
      let newSettings = {};
      
      let checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
      checkboxes.forEach(box => {
        let lId = box.dataset.listId;
        let cfId = box.dataset.cfId;
        if (!newSettings[lId]) newSettings[lId] = [];
        newSettings[lId].push(cfId);
      });
      
      t.set('board', 'shared', 'listFieldSettings', newSettings)
      .then(function() {
        t.closePopup();
      });
    });
    
  }).catch(function(err) {
    loading.innerText = "Error in Trello API: " + (err.message || JSON.stringify(err));
  });

} catch (error) {
  loading.innerText = "Fatal JS Error: " + (error.message || error);
}
