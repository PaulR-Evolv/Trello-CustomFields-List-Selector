const t = window.TrelloPowerUp.iframe();

const loading = document.getElementById('loading');
const container = document.getElementById('lists-container');
const footer = document.getElementById('footer');
const saveBtn = document.getElementById('save-btn');

try {
  // Read the data that client.js handed to us
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
    
    // Reveal the Interface and the footer!
    loading.style.display = 'none';
    footer.style.display = 'flex';
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
    
    // 🚨 NEW LOGIC: Try to save, but catch the error if Trello blocks it!
    t.set('board', 'shared', 'listFieldSettings', newSettings)
    .then(function() {
      // If successful, close the pop-up
      return t.closePopup();
    })
    .catch(function(error) {
      // If Trello blocks it, turn the button red and print the error to the screen
      saveBtn.innerText = "Save Failed!";
      saveBtn.style.backgroundColor = "#EB5A46"; // Trello Red
      saveBtn.style.color = "white";
      
      loading.innerText = "Trello Error: " + (error.message || JSON.stringify(error));
      loading.style.display = 'block';
      loading.style.color = '#EB5A46';
      loading.style.fontWeight = 'bold';
    });
  });

} catch (error) {
  loading.innerText = "Fatal JS Error: " + (error.message || error);
}
