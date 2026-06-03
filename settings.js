const t = window.TrelloPowerUp.iframe();

const loading = document.getElementById('loading');
const container = document.getElementById('lists-container');
const footer = document.getElementById('footer');
const saveBtn = document.getElementById('save-btn');

try {
  const lists = t.arg('lists') || [];
  const customFields = t.arg('customFields') || [];
  const savedSettings = t.arg('savedSettings') || {};
  
  if (lists.length === 0) {
    loading.innerText = "No lists found. Please close and try again.";
  } else {
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
        
        if (savedSettings[list.id] && savedSettings[list.id].includes(cf.id)) {
          checkbox.checked = true;
        }
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + cf.name));
        details.appendChild(label);
      });
      
      container.appendChild(details);
    });
    
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
    
    t.set('board', 'shared', 'listFieldSettings', newSettings)
    .then(function() {
      // 🚨 FIX: Visually show success immediately so it never freezes
      saveBtn.innerText = "✅ Saved Successfully!";
      saveBtn.style.backgroundColor = "#61BD4F"; // Trello Green
      saveBtn.style.color = "white";
      
      // Smoothly close the popup after 800 milliseconds
      setTimeout(function() {
        t.closePopup();
      }, 800);
    })
    .catch(function(error) {
      saveBtn.innerText = "Save Failed!";
      saveBtn.style.backgroundColor = "#EB5A46"; 
      saveBtn.style.color = "white";
      console.error(error);
    });
  });

} catch (error) {
  loading.innerText = "Fatal JS Error: " + (error.message || error);
}
