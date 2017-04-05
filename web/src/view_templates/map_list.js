templates.map_list = 
   ['<div class="small-12 columns">',
    '   <div class="row" id="map_list_area">',
    '       <div class="small-8 large-10 columns">',
    '           <div class="map_list_scroll_wrapper" id="map_list">',
    '           </div>',
    '       </div>',
    '       <div class="small-4 large-2 columns" id="add_map_wrapper">',
    '           <div class="row">',
    '               <div class="small-4 medium-12 columns">',
    '                  <button type="button" class="button" id="add_map_button">Karte hinzufügen</button>',
    '               </div>',
    '               <div class="small-5 medium-12 columns">',
    '                  <button type="button" class="alert button" id="remove_map_button">Karte entfernen</button>',
    '               </div>',
    '               <div class="small-12 columns">',
    '                  <button type="button" class="success button" id="submit_path_button">Fertig!</button>',
    '               </div>',
    '           </div>',
    '       </div>',
    '   </div>',
    '</div>'].join('\n');

templates.map_list_item = 
    ['<div class="map_item" data-map-index="<%= data.map_index %>">',
     '  <img src="<%= data.map_src %>" />',
     '</div>'].join('\n');
