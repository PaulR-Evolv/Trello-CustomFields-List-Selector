const t = window.TrelloPowerUp.iframe();

const loading = document.getElementById('loading');
const viewDisplay = document.getElementById('view-display');
const viewColors = document.getElementById('view-colors');
const listsContainer = document.getElementById('lists-container');
const colorsContainer = document.getElementById('colors-container');
const adoptCheckbox = document.getElementById('adopt-native-checkbox');

const footer = document.getElementById('footer');
const saveBtn = document.getElementById('save-btn');
const configColorsBtn = document.getElementById('config-colors-btn');

// State tracking variable
let currentView = 'display'; 

try {
  // Safe argument extractions
  const lists = t.arg('lists') || [];
  const customFields = t.arg('customFields') || [];
  const savedSettings = t.arg('savedSettings') || {};
  const fieldColorSettings = t.arg('fieldColorSettings') || { adoptNative: false, colors: {} };
  
  if (lists.length === 0) {
    loading.innerText = "No lists found. Please close and try again.";
  } else {
    
    // --- BUILD UI PART A: LIST CHECKBOXES ---
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
      
      listsContainer.appendChild(details);
    });
    
    // --- BUILD UI PART B: MANUAL FIELD PALETTE OVERRIDES ---
    adoptCheckbox.checked = !!fieldColorSettings.adoptNative;
    const paletteOptions = ['light-gray', 'blue', 'sky', 'green', 'lime', 'yellow', 'orange', 'red', 'purple', 'pink'];
    
    customFields.forEach(cf => {
      let row = document.createElement('div');
      row.className = 'color-row';
      
      let label = document.createElement('span');
      label.className = 'color-field-label';
      label.innerText = cf.name;
      
      let select = document.createElement('select');
      select.className = 'color-select';
      select.dataset.cfId = cf.id;
      
      paletteOptions.forEach(color => {
        let opt = document.createElement('option');
        opt.value = color;
        // Text cleaning format (e.g., 'light-gray' -> 'Light Gray')
        opt.innerText = color.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        let savedColor = (fieldColorSettings.colors && fieldColorSettings.colors[cf.id]) || 'light-gray';
        if (savedColor === color) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
      
      row.appendChild(label);
      row.appendChild(select);
      colorsContainer.appendChild(row);
    });
    
    // Disengage loading indicators
    loading.style.display = 'none';
    footer.style.display = 'flex';
  }

  // --- CONTROLLER ACTION: TWO-PANEL SWITCH VIEWS ---
  configColorsBtn.addEventListener('click', function() {
    // Clear save styling resets
    saveBtn.className = 'mod-primary';
    
    if (currentView === 'display') {
      currentView = 'colors';
      viewDisplay.style.display = 'none';
      viewColors.style.display = 'block';
      saveBtn.innerText = "Save Color Settings";
      configColorsBtn.innerText = "Back to Lists Layout";
    } else {
      currentView = 'display';
      viewColors.style.display = 'none';
      viewDisplay.style.display = 'block';
      saveBtn.innerText = "Save Display Settings";
      configColorsBtn.innerText = "Configure Colors";
    }
  });

  // --- CONTROLLER ACTION: INTELLIGENT SAVING PATTERNS ---
  saveBtn.addEventListener('click', function() {
    saveBtn.innerText = "Saving...";
    saveBtn.classList.remove('save-success', 'save-failed');
    
    if (currentView === 'display') {
      // Execute Path A: Save Display Configurations per List
      let newSettings = {};
      let checkboxes = document.querySelectorAll('#lists-container input[type="checkbox"]:checked');
      
      checkboxes.forEach(box => {
        let lId = box.dataset.listId;
        let cfId = box.dataset.cfId;
        if (!newSettings[lId]) newSettings[lId] = [];
        newSettings[lId].push(cfId);
      });
      
      t.set('board', 'shared', 'listFieldSettings', newSettings)
      .then(executeVisualSuccess)
      .catch(executeVisualError);
    } else {
      // Execute Path B: Save Board-wide Global Color Preferences
      let newColorsPackage = {
        adoptNative: adoptCheckbox.checked,
        colors: {}
      };
      
      let selects = document.querySelectorAll('.color-select');
      selects.forEach(select => {
        let cfId = select.dataset.cfId;
        newColorsPackage.colors[cfId] = select.value;
      });
      
      t.set('board', 'shared', 'fieldColorSettings', newColorsPackage)
      .then(executeVisualSuccess)
      .catch(executeVisualError);
    }
  });

  function executeVisualSuccess() {
    saveBtn.innerText = "✅ Saved Successfully!";
    saveBtn.classList.add('save-success');
    
    if (window.buttonTimer) clearTimeout(window.buttonTimer);
    
    window.buttonTimer = setTimeout(function() {
      saveBtn.innerText = (currentView === 'display') ? "Save Display Settings" : "Save Color Settings";
      saveBtn.classList.remove('save-success');
    }, 2000);
  }

  function executeVisualError(err) {
    saveBtn.innerText = "Save Failed!";
    saveBtn.classList.add('save-failed');
    console.error("Database Write Crash:", err);
  }

} catch (error) {
  loading.innerText = "Fatal UI Compiler Error: " + (error.message || error);
}
