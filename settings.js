const t = window.TrelloPowerUp.iframe();

const loading = document.getElementById('loading');
const container = document.getElementById('lists-container');
const saveBtn = document.getElementById('save-btn');

try {
  // 🚨 NEW LOGIC: Just read the data that client.js securely handed to us!
  const lists = t.arg('lists') || [];
  const customFields = t.arg('customFields') || [];
  const savedSettings = t.arg('savedSettings') || {};
  
  if (lists.length === 0) {
    loading.innerText = "No lists found. Please close and try again.";
  } else {
    // Build the UI
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
        
        // Check the box if they saved it previously
        if (savedSettings[list.id] && savedSettings[list.id].includes(cf.id)) {
          checkbox.checked = true;
        }
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + cf.name));
        details.appendChild(label);
      });
      
      container.appendChild(details);
    });
    
    // Show the Interface
    loading.style.display = 'none';
    saveBtn.style.display = 'block';
  }

  // Save the user's choices
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

} catch (error) {
  loading.innerText = "Fatal JS Error: " + (error.message || error);
}
