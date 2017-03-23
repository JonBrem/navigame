templates.map_selection_dialog = 
   ['<div class="reveal" id="map_selection_modal">',
    '   <h1>Kartenauswahl</h1>',
    '   <div id="map_selection_area_selection">&nbsp;</div>',
    '   <div id="map_selection_level_selection">&nbsp;</div>',
    '   <button class="close-button" data-close aria-label="Close modal" type="button">',
    '        <span aria-hidden="true">&times;</span>',
    '   </button>',
    '</div>'].join('\n');

templates.map_selection_dialog_select_area = 
    ['<select name="map_selection_area_select" id="map_selection_area_input">',
     '  <option value="default" selected> - Gebiet ausw&auml;hlen -</option>',
     '  <% for (let i = 0; i < data.options.length; i++) { %>',
     '      <option value="<%= data.options[i].filename %>"><%= data.options[i].name %></option>',
     '  <% } %>',
     '</select>'].join('\n');
