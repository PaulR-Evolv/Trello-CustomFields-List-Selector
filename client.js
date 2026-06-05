/* global TrelloPowerUp */

// Helper Function: Trello custom field data is messy. This cleanly extracts the text/numbers.
function getFieldValue(item, fieldDef) {
  if (item.value) {
    if (item.value.text) return item.value.text;
    if (item.value.number) return item.value.number.toString();
    if (item.value.date) return new Date(item.value.date).toLocaleDateString();
  }
  // If it's a dropdown list option:
  if (item.idValue && fieldDef.options) {
    let option = fieldDef.options.find(opt => opt.id === item.idValue);
    if (option && option.value && option.value.text) return option.value.text;
  }
  return null;
}

window.TrelloPowerUp.initialize({
  
  // 1. TURN ON THE SETTINGS GEAR ICON
  'show-settings': function(t, options) {
    return Promise.all([
      t.lists('all').catch(() => []),
      t.board('customFields').catch(() => []),
      t.get('board', 'shared', 'listFieldSettings', {}),
      t.get('board', 'shared', 'fieldColorSettings', { adoptNative: false, colors: {} }) // Fetch global colors
    ]).then(function(results) {
      
      // Open the popup and inject all data packages
      return t.popup({
        title: 'Dynamic Field Display',
        url: './settings.html',
        height: 450,
        args: { 
          lists: results[0] || [],
          customFields: Array.isArray(results[1]) ? results[1] : (results[1].customFields || []),
          savedSettings: results[2] || {},
          fieldColorSettings: results[3] || { adoptNative: false, colors: {} }
        }
      });
    });
  },

  // 2. GENERATE THE BADGES BASED ON ADVANCED COLOR LOGIC
  'card-badges': function(t, options) {
    return Promise.all([
      t.list('id').catch(() => null),
      t.board('customFields').catch(() => []),
      t.card('customFieldItems').catch(() => []),
      t.get('board', 'shared', 'listFieldSettings', {}),
      t.get('board', 'shared', 'fieldColorSettings', { adoptNative: false, colors: {} }) 
    ])
    .then(function(results) {
      const currentList = results[0] || {};
      
      // Defensive checks to make sure Trello data maps cleanly as Arrays
      const boardCustomFields = Array.isArray(results[1]) ? results[1] : (results[1].customFields || []);
      const cardCustomFields = Array.isArray(results[2]) ? Array.isArray(results[2]) ? results[2] : [] : (results[2].customFieldItems || []);
      
      const savedSettings = results[3] || {};
      const fieldColorSettings = results[4] || { adoptNative: false, colors: {} };
      
      const listId = currentList.id;
      
      if (!listId || !savedSettings[listId] || savedSettings[listId].length === 0) {
        return [];
      }
      
      let badges = [];
      
      savedSettings[listId].forEach(targetCfId => {
        let fieldDef = boardCustomFields.find(cf => cf.id === targetCfId);
        let cardItem = cardCustomFields.find(item => item.idCustomField === targetCfId);
        
        if (fieldDef && cardItem) {
          let valueText = getFieldValue(cardItem, fieldDef);
          
          if (valueText) {
            // 🚨 ADVANCED COLOR PICKER LOGIC
            let badgeColor = 'light-gray'; // Default fallback color
            
            // Check Rule A: If "Adopt Native Colors" is true AND this is a dropdown field with a choice
            if (fieldColorSettings.adoptNative && cardItem.idValue && fieldDef.options) {
              let selectedOption = fieldDef.options.find(opt => opt.id === cardItem.idValue);
              if (selectedOption && selectedOption.color) {
                badgeColor = selectedOption.color; // Pull native color mapping
              } else if (fieldColorSettings.colors && fieldColorSettings.colors[targetCfId]) {
                badgeColor = fieldColorSettings.colors[targetCfId]; // Fall back to user custom map if no native color
              }
            } 
            // Check Rule B: Go directly to user custom manual setting override
            else if (fieldColorSettings.colors && fieldColorSettings.colors[targetCfId]) {
              badgeColor = fieldColorSettings.colors[targetCfId];
            }
            
            badges.push({
              text: fieldDef.name + ": " + valueText,
              color: badgeColor 
            });
          }
        }
      });
      
      return badges;
    })
    .catch(err => {
      console.error("Badge Render Error:", err);
      return [];
    });
  }
});
