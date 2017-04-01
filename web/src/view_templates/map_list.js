templates.map_list = 
   ['<div class="small-12 columns">',
    '   <div class="row" id="map_list_area">',
    '       <div class="small-10 columns">',
    '           <div class="map_list_scroll_wrapper" id="map_list">',
    '           </div>',
    '       </div>',
    '       <div class="small-2 columns" id="add_map_wrapper">',
    '           <div>',
    '              <button type="button" class="button" id="add_map_button">Add Map</button>',
    '           </div>',
    '           <div>',
    '              <button type="button" class="button" id="remove_map_button">Remove Map</button>',
    '           </div>',
    '           <div>',
    '              <button type="button" class="button" id="submit_path_button">Submit Path</button>',
    '           </div>',
    '       </div>',
    '   </div>',
    '</div>'].join('\n');

templates.map_list_item = 
    ['<div class="map_item" data-map-index="<%= data.map_index %>">',
     '  <img src="<%= data.map_src %>" />',
     '</div>'].join('\n');
