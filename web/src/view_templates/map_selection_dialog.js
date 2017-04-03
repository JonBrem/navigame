templates.map_selection_dialog = 
   ['<div class="reveal" id="map_selection_modal">',
    '   <h1>Kartenauswahl</h1>',
    '   <% if ("showPathPoints" in data && data.showPathPoints) { %>',
    '       <div>Wählen Sie die erste Karte auf dem Weg von <strong><%= data.start %></strong> nach <strong><%= data.goal %></strong>.</div>',
    '   <% } %>',
    '   <div id="map_selection_area_selection">&nbsp;</div>',
    '   <div id="map_selection_level_selection">&nbsp;</div>',
    '   <div style="display: none"><button id="map_selection_confirm" class="button">Ausw&auml;hlen</button></div>',
    '   <% if (data.closable) { %>',
    '   <button class="close-button" data-close aria-label="Close modal" type="button">',
    '        <span aria-hidden="true">&times;</span>',
    '   </button>',
    '   <% } %>',
    '</div>'].join('\n');

templates.map_selection_dialog_select_area = 
    ['<select name="map_selection_area_select" id="map_selection_area_input">',
     '  <option value="default" selected> - Gebiet ausw&auml;hlen -</option>',
     '  <% for (let i = 0; i < data.options.length; i++) { %>',
     '      <option value="<%= data.options[i].filename %>"><%= data.options[i].name %></option>',
     '  <% } %>',
     '</select>'].join('\n');

templates.map_selection_dialog_select_level =
    ['<div class="row collapse">',
     '  <div class="small-4 columns">',
     '      <ul class="tabs vertical" id="map_selection_levels_vert_tabs" data-tabs role="tablist">',
     '          <% for (let i = 0; i < data.options.length; i++) { %>',
     '              <li class="tabs-title<%= ((i == 0)? " is-active" : "") %>">',
     '                  <a href="#level_select_panel_<%= data.options[i].level_id %>" ' +
     '                      data-level-id="<%= data.options[i].level_id %>" data-img-src="<%= data.options[i].image_path %>">',
     '                      Stockwerk <%= data.options[i].storey %>',
     '                  </a>',
     '              </li>',
     '          <% } %>',
     '      </ul>',
     '  </div>',
     '  <div class="small-8 columns">',
     '      <div class="tabs-content vertical" data-tabs-content="map_selection_levels_vert_tabs">',
     '          <% for (let i = 0; i < data.options.length; i++) { %>',
     '              <div class="tabs-panel<%= ((i == 0)? " is-active" : "") %>" id="level_select_panel_<%= data.options[i].level_id %>">',
     '                  <img src="<%= data.options[i].image_path %>" />',
     '              </div>',
     '          <% } %>',
     '      </div>',
     '  </div>',
     '</div>'].join('\n');
