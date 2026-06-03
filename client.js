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
    
    // 🚨 NEW LOGIC: Ask Trello for the data HERE in the background, not in the popup!
    return Promise.all([
      t.lists('all').catch(() => []),
      t.board('customFields').catch(() => ({ customFields: [] })),
      t.get('board', 'shared', 'listFieldSettings', {})
    ]).then(function(results) {
      
      // Open the popup and pass the data directly into it!
      return t.popup({
        title: 'Dynamic Field Display',
        url: './settings.html',
        height: 450,
        args: { 
          lists: results[0] || [],
          customFields: (results[1] && results[1].customFields) ? results[1].customFields : [],
          savedSettings: results[2] || {}
        }
      });
    });
  },

  // 2. GENERATE THE BADGES BASED ON SETTINGS
  'card-badges': function(t, options) {
    return Promise.all([
      t.list('id').catch(() => null),
      t.board('customFields').catch(() => null),
      t.card('customFieldItems').catch(() => null),
      t.get('board', 'shared', 'listFieldSettings', {}) 
    ])
    .then(function(results) {
      const currentList = results[0] || {};
      const boardCustomFields = results[1] || [];
      const cardCustomFields = results[2] || [];
      const savedSettings = results[3] || {};
      
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
            badges.push({
              text: fieldDef.name + ": " + valueText,
              color: 'light-gray' 
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
 
