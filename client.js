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
    return t.popup({
      title: 'Dynamic Field Display',
      url: './settings.html',
      height: 450 // Controls how tall the pop-up window is
    });
  },

  // 2. GENERATE THE BADGES BASED ON SETTINGS
  'card-badges': function(t, options) {
    
    return Promise.all([
      t.list('id').catch(() => null),
      t.board('customFields').catch(() => null),
      t.card('customFieldItems').catch(() => null),
      t.get('board', 'shared', 'listFieldSettings', {}) // Read the saved settings database!
    ])
    .then(function(results) {
      const currentList = results[0] || {};
      const boardCustomFields = results[1] || [];
      const cardCustomFields = results[2] || [];
      const savedSettings = results[3] || {};
      
      const listId = currentList.id;
      
      // If the current list has no settings saved, ignore it and return empty
      if (!listId || !savedSettings[listId] || savedSettings[listId].length === 0) {
        return [];
      }
      
      let badges = [];
      
      // Look at the specific Custom Fields the user checked for this exact list
      savedSettings[listId].forEach(targetCfId => {
        let fieldDef = boardCustomFields.find(cf => cf.id === targetCfId);
        let cardItem = cardCustomFields.find(item => item.idCustomField === targetCfId);
        
        if (fieldDef && cardItem) {
          let valueText = getFieldValue(cardItem, fieldDef);
          
          if (valueText) {
            badges.push({
              text: fieldDef.name + ": " + valueText,
              color: 'light-gray' // Sleek, native-looking grey label
            });
          }
        }
      });
      
      return badges;
    })
    .catch(err => {
      console.error(err);
      return [];
    });
  }
});
