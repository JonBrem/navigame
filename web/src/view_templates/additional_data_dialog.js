templates.additional_data_dialog = 
   ['<div class="reveal" id="additional_data_modal">',
    '   <h1><%= data.whichType %> bearbeiten</h1>',
    '   <div id="data_dialog_items_area">',
    '       <% for (let i = 0; i < data.items.length; i++) { %>',
    '           <%= compiledTemplates["additional_data_item"]({data: data.items[i]}) %>',
    '       <% } %>',
    '   </div>',
    '   <div><button id="data_dialog_plus_button" class="button">Eintrag Hinzufügen</button></div>',
    '   <div><button id="data_dialog_ok_button" class="button">Aktualisieren</button></div>',
    '   <button class="close-button" data-close aria-label="Close modal" type="button">',
    '        <span aria-hidden="true">&times;</span>',
    '   </button>',
    '</div>'].join('\n');

templates.additional_data_item = 
    ['<div class="row additional_data_input_area">',
     '  <div class="small-4 columns">',
     '      <input class="additional_data_input_key" type="text" placeholder="key" <% if ("key" in data) { %>value="<%= data.key %>"<% } %> />',
     '  </div>',
     '  <div class="small-8 columns">',
     '      <input class="additional_data_input_value" type="text" placeholder="value" <% if ("value" in data) { %>value="<%= data.value %>"<% } %> />',
     '  </div>',
     '</div>'].join('\n');
